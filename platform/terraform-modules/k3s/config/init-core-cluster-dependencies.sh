#!/bin/bash
set -euo pipefail

# Check if all required arguments are passed
if [ "$#" -ne 3 ]; then
  echo "Usage: $0 <hcloud_token> <network_name> <cloudflare_tunnel_token>"
  exit 1
fi

hcloud_token=$1
network_name=$2
cloudflare_tunnel_token=$3

CHARTS_DIR="/tmp/charts"

# Helper function to install helm chart repos from Chart.lock
install_chart_repos() {
  local chart_dir="$1"
  if [ -f "${chart_dir}/Chart.lock" ]; then
    yq --indent 0 '.dependencies | map(["helm", "repo", "add", .name, .repository] | join(" ")) | .[]' "${chart_dir}/Chart.lock" | sh --;
  fi
}

# Extract bootstrap charts archives
echo "Extracting bootstrap charts..."
for chart in hetzner-cloud-controller argocd; do
  mkdir -p "${CHARTS_DIR}/${chart}"
  tar -xzf "${CHARTS_DIR}/${chart}.tar.gz" -C "${CHARTS_DIR}/${chart}"
  rm -f "${CHARTS_DIR}/${chart}.tar.gz"
done

# Install yq
wget -q https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -O /usr/bin/yq && \
chmod +x /usr/bin/yq

# Install helm
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh
rm ./get_helm.sh

# Wait for k3s to be ready
timeout 120 bash -c '
  until systemctl status k3s > /dev/null 2>&1; do
    echo "Waiting for the k3s server to start..."
    sleep 2
  done

  until [ -e /etc/rancher/k3s/k3s.yaml ]; do
    echo "Waiting for kubectl config..."
    sleep 2
  done

  until [[ "$(kubectl get --raw="/readyz" 2> /dev/null)" == "ok" ]]; do
    echo "Waiting for the cluster to become ready..."
    sleep 2
  done
'

export KUBECONFIG="/etc/rancher/k3s/k3s.yaml"

# Setup kubeconfig for engineer user
mkdir -p /home/engineer/.kube
cp /etc/rancher/k3s/k3s.yaml /home/engineer/.kube/config
chown -R engineer:engineer /home/engineer/.kube
chmod 600 /home/engineer/.kube/config

# Install hetzner-cloud-controller from repo chart
echo "Installing Hetzner Cloud Controller..."
kubectl -n kube-system create secret generic hcloud --from-literal=token="$hcloud_token" --from-literal=network="$network_name"
kubectl -n kube-system create secret generic hcloud-csi --from-literal=token="$hcloud_token"
install_chart_repos "${CHARTS_DIR}/hetzner-cloud-controller"
helm dependency build "${CHARTS_DIR}/hetzner-cloud-controller"
helm install hetzner-cloud-controller "${CHARTS_DIR}/hetzner-cloud-controller" -n kube-system

# Install ArgoCD from repo chart (with control-plane tolerations for bootstrap)
echo "Installing ArgoCD..."
install_chart_repos "${CHARTS_DIR}/argocd"
helm dependency build "${CHARTS_DIR}/argocd"
helm install argocd "${CHARTS_DIR}/argocd" -n argocd --create-namespace \
  --set 'global.tolerations[0].key=node-role.kubernetes.io/control-plane' \
  --set 'global.tolerations[0].operator=Exists' \
  --set 'global.tolerations[0].effect=NoSchedule' \
  --set 'argo-cd.configs.cm.admin\.enabled=true'

echo "Waiting for ArgoCD to be ready..."
kubectl -n argocd wait --for=condition=available deployment/argocd-server --timeout=300s || true

# Clean up charts and downloaded dependencies from the server
echo "Cleaning up bootstrap files..."
rm -rf "${CHARTS_DIR}"
rm -rf /opt/scripts

echo "Bootstrap complete!"
