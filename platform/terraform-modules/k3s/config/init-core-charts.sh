#!/bin/bash

install_chart_repos() {
  local chart_dir="$1"
  if [ -f "${chart_dir}/Chart.lock" ]; then
    yq --indent 0 '.dependencies | map(["helm", "repo", "add", .name, .repository] | join(" ")) | .[]' "${chart_dir}/Chart.lock"  | sh --;
  fi
}

cloudflare_tunnel_token=$1

# Install ingress-nginx
install_chart_repos /tmp/ingress-nginx
helm dependency build /tmp/ingress-nginx
helm install ingress-nginx /tmp/ingress-nginx -n ingress-nginx -f /tmp/ingress-nginx/values.prod.yaml --create-namespace

# Install argocd
install_chart_repos /tmp/argocd
helm dependency build /tmp/argocd
helm install argocd /tmp/argocd -n argocd --create-namespace

# Install cloudflared
kubectl create ns cloudflare
kubectl -n cloudflare create secret generic cloudflare-tunnel-token --from-literal=token=$cloudflare_tunnel_token
install_chart_repos /tmp/cloudflared
helm dependency build /tmp/cloudflared
helm install cloudflared /tmp/cloudflared -n cloudflare --create-namespace

# Remove charts from the server
rm -rf /tmp/ingress-nginx /tmp/argocd
