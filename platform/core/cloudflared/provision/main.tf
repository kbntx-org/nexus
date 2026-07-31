resource "cloudflare_zero_trust_tunnel_cloudflared" "k3s_tunnel" {
  account_id = var.cloudflare_account_id
  name       = "k3s"
  config_src = "cloudflare"
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
    token = data.cloudflare_zero_trust_tunnel_cloudflared_token.k3s_tunnel_token.token
  })
}
