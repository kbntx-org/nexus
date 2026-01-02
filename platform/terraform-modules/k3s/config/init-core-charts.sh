#!/bin/bash

install_chart_repos() {
  local chart_dir="$1"
  if [ -f "${chart_dir}/Chart.lock" ]; then
    yq --indent 0 '.dependencies | map(["helm", "repo", "add", .name, .repository] | join(" ")) | .[]' "${chart_dir}/Chart.lock"  | sh --;
  fi
}

cloudflare_tunnel_token=$1

# Install traefik
install_chart_repos /tmp/traefik-ingress
helm dependency build /tmp/traefik-ingress
helm install traefik-ingress /tmp/traefik-ingress -n traefik-ingress -f /tmp/traefik-ingress/values.prod.yaml --create-namespace

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
rm -rf /tmp/traefik-ingress /tmp/argocd
