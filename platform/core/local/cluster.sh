#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAME="kind"
REGISTRY_NAME="kind-registry"
REGISTRY_PORT="5005"
KUBERNETES_VERSION="v1.36.1"
POD_SUBNET="10.42.0.0/16"
SERVICE_SUBNET="10.43.0.0/16"
WEB_NODE_PORT="30080"
WEBSECURE_NODE_PORT="30443"
KUBE_CONTEXT="kind-${CLUSTER_NAME}"
TRAEFIK_NAMESPACE="traefik"
TLS_SECRET_NAME="default-tls"
TLS_CERTIFICATE_DOMAINS=("localhost")
INGRESS_WATCH_INTERVAL_SECONDS="30"

ensure_kube_context() {
  if ! kubectl config get-contexts "${KUBE_CONTEXT}" &> /dev/null; then
    echo "Kubernetes context '${KUBE_CONTEXT}' does not exist. Run '$0 create' first." >&2
    exit 1
  fi
  kubectl config use-context "${KUBE_CONTEXT}" &> /dev/null
}

create() {
  if [ "$(docker inspect -f '{{.State.Running}}' "${REGISTRY_NAME}" 2>/dev/null || true)" = 'true' ]; then
    echo "Registry '${REGISTRY_NAME}' is already running."
  else
    echo "Starting local registry..."
    docker run \
      --detach \
      --restart=always \
      --publish "127.0.0.1:${REGISTRY_PORT}:5000" \
      --name "${REGISTRY_NAME}" \
      registry:2
    echo "Registry '${REGISTRY_NAME}' started on port ${REGISTRY_PORT}."
  fi

  echo "Creating kind cluster '${CLUSTER_NAME}' (Kubernetes ${KUBERNETES_VERSION})..."
  cat <<EOF | kind create cluster \
    --name "${CLUSTER_NAME}" \
    --image "kindest/node:${KUBERNETES_VERSION}" \
    --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: ${WEB_NODE_PORT}
        hostPort: 80
        protocol: TCP
      - containerPort: ${WEBSECURE_NODE_PORT}
        hostPort: 443
        protocol: TCP
networking:
  podSubnet: "${POD_SUBNET}"
  serviceSubnet: "${SERVICE_SUBNET}"
  disableDefaultCNI: true
  kubeProxyMode: "none"
kubeadmConfigPatches:
  - |
    kind: KubeletConfiguration
    serializeImagePulls: false
containerdConfigPatches:
  - |-
    [plugins."io.containerd.grpc.v1.cri".registry]
      config_path = "/etc/containerd/certs.d"
EOF

  ensure_kube_context

  # Make localhost:5000 on each node seen as the registry:5005
  echo "Configuring containerd registry mirror on each node..."
  REGISTRY_DIR="/etc/containerd/certs.d/localhost:${REGISTRY_PORT}"
  for node in $(kind get nodes --name "${CLUSTER_NAME}"); do
    docker exec "${node}" mkdir -p "${REGISTRY_DIR}"
    cat <<EOF | docker exec --interactive "${node}" cp /dev/stdin "${REGISTRY_DIR}/hosts.toml"
[host."http://${REGISTRY_NAME}:5000"]
EOF
  done

  echo "Connecting registry to kind network..."
  if [ "$(docker inspect -f='{{json .NetworkSettings.Networks.kind}}' "${REGISTRY_NAME}")" = 'null' ]; then
    docker network connect "kind" "${REGISTRY_NAME}"
  fi

  kubectl apply --filename - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: local-registry-hosting
  namespace: kube-public
data:
  localRegistryHosting.v1: |
    host: "localhost:${REGISTRY_PORT}"
    help: "https://kind.sigs.k8s.io/docs/user/local-registry/"
EOF

  setup_local_tls_certificate

  echo "✅ Cluster '${CLUSTER_NAME}' is ready."
  echo "   Registry:   localhost:${REGISTRY_PORT}"
  echo "   Kubeconfig: $(kubectl config current-context)"
}

ensure_mkcert() {
  if ! command -v mkcert &> /dev/null; then
    if ! command -v brew &> /dev/null; then
      echo "mkcert is not installed and Homebrew is not available." >&2
      echo "Install mkcert manually: https://github.com/FiloSottile/mkcert#installation" >&2
      exit 1
    fi
    echo "Installing mkcert..."
    brew install mkcert
  fi
}

issue_tls_certificate() {
  local domains=("$@")

  local certificateDirectory
  certificateDirectory="$(mktemp -d)"
  local certificateFile="${certificateDirectory}/localhost.pem"
  local certificateKeyFile="${certificateDirectory}/localhost-key.pem"

  echo "Generating TLS certificate for ${domains[*]}..."
  mkcert -cert-file "${certificateFile}" -key-file "${certificateKeyFile}" "${domains[@]}"

  if ! kubectl get namespace "${TRAEFIK_NAMESPACE}" &> /dev/null; then
    echo "Creating namespace '${TRAEFIK_NAMESPACE}'..."
    kubectl create namespace "${TRAEFIK_NAMESPACE}"
  fi

  echo "Applying '${TLS_SECRET_NAME}' TLS secret to namespace '${TRAEFIK_NAMESPACE}'..."
  kubectl create secret tls "${TLS_SECRET_NAME}" \
    --namespace "${TRAEFIK_NAMESPACE}" \
    --cert="${certificateFile}" \
    --key="${certificateKeyFile}" \
    --dry-run=client -o yaml | kubectl apply -f -

  rm -rf "${certificateDirectory}"
}

setup_local_tls_certificate() {
  ensure_mkcert

  echo "Installing the mkcert local certificate authority into the system trust store..."
  mkcert -install

  issue_tls_certificate "${TLS_CERTIFICATE_DOMAINS[@]}"
}

discover_ingress_hosts() {
  kubectl get ingressroutes.traefik.io --all-namespaces \
    -o jsonpath='{range .items[*]}{range .spec.routes[*]}{.match}{"\n"}{end}{end}' 2>/dev/null \
    | grep -oE 'Host\(`[^`]+`\)' \
    | sed -E 's/Host\(`([^`]+)`\)/\1/' \
    | grep -vE '^localhost$' \
    | sort -u || true
}

watch_ingresses() {
  ensure_kube_context
  ensure_mkcert

  echo "Watching IngressRoute hosts every ${INGRESS_WATCH_INTERVAL_SECONDS}s (press Ctrl+C to stop)..."
  local knownHosts=""

  while true; do
    local currentHosts
    currentHosts="$(discover_ingress_hosts)"

    if [ "${currentHosts}" != "${knownHosts}" ]; then
      local newHosts
      newHosts="$(comm -13 <(echo "${knownHosts}") <(echo "${currentHosts}"))"
      if [ -n "${newHosts}" ]; then
        while IFS= read -r host; do
          echo "New ingress host detected: ${host}"
        done <<< "${newHosts}"
      fi

      local domains=("${TLS_CERTIFICATE_DOMAINS[@]}")
      if [ -n "${currentHosts}" ]; then
        while IFS= read -r host; do
          domains+=("${host}")
        done <<< "${currentHosts}"
      fi

      issue_tls_certificate "${domains[@]}"
      knownHosts="${currentHosts}"
    fi

    sleep "${INGRESS_WATCH_INTERVAL_SECONDS}"
  done
}

delete() {
  echo "Deleting kind cluster '${CLUSTER_NAME}'..."
  kind delete cluster --name "${CLUSTER_NAME}" || true

  echo "Removing registry container '${REGISTRY_NAME}'..."
  docker rm --force "${REGISTRY_NAME}" 2>/dev/null || true

  echo "✅ Cluster and registry deleted."
}

recreate() {
  delete
  create
}

case "${1:-}" in
  create) create ;;
  delete) delete ;;
  recreate) recreate ;;
  watch-ingresses) watch_ingresses ;;
  *)
    echo "Usage: $0 <create|delete|recreate|watch-ingresses>" >&2
    exit 1
    ;;
esac
