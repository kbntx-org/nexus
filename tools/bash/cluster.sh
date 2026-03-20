#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAME="kind"
REGISTRY_NAME="kind-registry"
REGISTRY_PORT="5005"
KUBERNETES_VERSION="v1.33.4"

create() {
  # ── Registry ─────────────────────────────────────────────────────────────────
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

  # ── Cluster ───────────────────────────────────────────────────────────────────
  echo "Creating kind cluster '${CLUSTER_NAME}' (Kubernetes ${KUBERNETES_VERSION})..."
  cat <<EOF | kind create cluster \
    --name "${CLUSTER_NAME}" \
    --image "kindest/node:${KUBERNETES_VERSION}" \
    --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    # Map host port 80 to the Traefik NodePort (30080) on the node.
    # This is what makes *.localhost routing work without kubectl port-forward.
    # Using NodePort instead of hostPort allows multiple Traefik replicas.
    extraPortMappings:
      - containerPort: 30080
        hostPort: 80
        protocol: TCP
containerdConfigPatches:
  - |-
    [plugins."io.containerd.grpc.v1.cri".registry]
      config_path = "/etc/containerd/certs.d"
EOF

  # ── Registry mirror per node ──────────────────────────────────────────────────
  # Configures each node to resolve localhost:${REGISTRY_PORT} as a mirror
  # pointing at the registry container inside the kind network.
  # Required because localhost inside a container refers to the container itself,
  # not the host — so we redirect it to the named registry container.
  echo "Configuring containerd registry mirror on each node..."
  REGISTRY_DIR="/etc/containerd/certs.d/localhost:${REGISTRY_PORT}"
  for node in $(kind get nodes --name "${CLUSTER_NAME}"); do
    docker exec "${node}" mkdir -p "${REGISTRY_DIR}"
    cat <<EOF | docker exec --interactive "${node}" cp /dev/stdin "${REGISTRY_DIR}/hosts.toml"
[host."http://${REGISTRY_NAME}:5000"]
EOF
  done

  # ── Connect registry to kind network ─────────────────────────────────────────
  echo "Connecting registry to kind network..."
  if [ "$(docker inspect -f='{{json .NetworkSettings.Networks.kind}}' "${REGISTRY_NAME}")" = 'null' ]; then
    docker network connect "kind" "${REGISTRY_NAME}"
  fi

  # ── Advertise registry in-cluster ─────────────────────────────────────────────
  # Follows KEP-1755: communicating a local registry to cluster consumers.
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

  echo "✅ Cluster '${CLUSTER_NAME}' is ready."
  echo "   Registry:   localhost:${REGISTRY_PORT}"
  echo "   Kubeconfig: $(kubectl config current-context)"
}

delete() {
  echo "Deleting kind cluster '${CLUSTER_NAME}'..."
  kind delete cluster --name "${CLUSTER_NAME}" || true

  echo "Removing registry container '${REGISTRY_NAME}'..."
  docker rm --force "${REGISTRY_NAME}" 2>/dev/null || true

  echo "✅ Cluster and registry deleted."
}

case "${1:-}" in
  create) create ;;
  delete) delete ;;
  *)
    echo "Usage: $0 <create|delete>" >&2
    exit 1
    ;;
esac
