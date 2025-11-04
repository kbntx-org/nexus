#!/bin/bash

install_chart_repos() {
  local chart_dir="$1"
  if [ -f "${chart_dir}/Chart.lock" ]; then
    yq --indent 0 '.dependencies | map(["helm", "repo", "add", .name, .repository] | join(" ")) | .[]' "${chart_dir}/Chart.lock"  | sh --;
  fi
}


# Check if all required arguments are passed
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <hcloud_token> <network_name>"
  exit 1
fi

hcloud_token=$1
network_name=$2

# Install yq
wget https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -O /usr/bin/yq && \
chmod +x /usr/bin/yq

# Install helm
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh
rm ./get_helm.sh

# Setup hcloud controller
helm repo add hcloud https://charts.hetzner.cloud
helm repo update hcloud

#Setup kubectl
timeout 120 bash -c '
  until systemctl status k3s > /dev/null; do
    systemctl start k3s
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

# Install hetzner-cloud-controller
kubectl -n kube-system create secret generic hcloud --from-literal=token=$hcloud_token --from-literal=network=$network_name
kubectl -n kube-system create secret generic hcloud-csi --from-literal=token=$hcloud_token
install_chart_repos /tmp/hetzner-cloud-controller
helm dependency build /tmp/hetzner-cloud-controller
helm install hetzner-cloud-controller /tmp/hetzner-cloud-controller -n kube-system --set hcloud-cloud-controller-manager.networking.enabled=true --set hcloud-cloud-controller-manager.networking.clusterCIDR=10.42.0.0/16

# Remove charts from the server
rm -rf /tmp/hetzner-cloud-controller
