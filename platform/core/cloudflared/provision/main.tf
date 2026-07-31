resource "cloudflare_zero_trust_tunnel_cloudflared" "k3s_tunnel" {
  account_id = var.cloudflare_account_id
  name       = "k3s"
  config_src = "cloudflare"
}

resource "cloudflare_zero_trust_tunnel_cloudflared_config" "k3s_tunnel_config" {
  account_id = var.cloudflare_account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.k3s_tunnel.id

  config = {
    ingress = [
      {
        hostname = "kbntx.com"
        service  = "http://traefik-ingress.traefik-ingress.svc.cluster.local"
      },
      {
        hostname = "*.kbntx.com"
        service  = "http://traefik-ingress.traefik-ingress.svc.cluster.local"
      },
      {
        service = "http_status:404"
      }
    ]
  }
}

resource "cloudflare_dns_record" "apex_root" {
  zone_id = var.cloudflare_zone_id
  name    = "kbntx.com"
  type    = "CNAME"
  content = "${cloudflare_zero_trust_tunnel_cloudflared.k3s_tunnel.id}.cfargotunnel.com"
  proxied = true
  ttl     = 1
}

resource "cloudflare_dns_record" "apex_wildcard" {
  zone_id = var.cloudflare_zone_id
  name    = "*.kbntx.com"
  type    = "CNAME"
  content = "${cloudflare_zero_trust_tunnel_cloudflared.k3s_tunnel.id}.cfargotunnel.com"
  proxied = true
  ttl     = 1
}

data "cloudflare_zero_trust_tunnel_cloudflared_token" "k3s_tunnel_token" {
  account_id = var.cloudflare_account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.k3s_tunnel.id
}

resource "vault_mount" "cloudflared" {
  path        = "cloudflared"
  type        = "kv-v2"
  description = "cloudflared tunnel credentials"
}

resource "vault_policy" "cloudflared_read" {
  name = "cloudflared-tunnel-read"

  policy = <<-EOT
    path "platform/data/tunnel-token" {
      capabilities = ["read"]
    }
  EOT
}

resource "vault_kubernetes_auth_backend_role" "cloudflared" {
  backend                          = "kubernetes"
  role_name                        = "cloudflared"
  bound_service_account_names      = ["cloudflared-secret-sa"]
  bound_service_account_namespaces = ["cloudflared"]
  token_policies                   = [vault_policy.cloudflared_read.name]
}

resource "vault_kv_secret_v2" "cloudflared_tunnel" {
  mount = "platform"
  name  = "cloudflared"

  data_json = jsonencode({
    tunnelToken = data.cloudflare_zero_trust_tunnel_cloudflared_token.k3s_tunnel_token.token
  })
}
