resource "vault_policy" "external_dns_read" {
  name = "external-dns-read"

  policy = <<-EOT
    path "platform/data/external-dns" {
      capabilities = ["read"]
    }
  EOT
}

resource "vault_kubernetes_auth_backend_role" "external_dns" {
  backend                          = "kubernetes"
  role_name                        = "external-dns"
  bound_service_account_names      = ["external-dns-secret-sa"]
  bound_service_account_namespaces = ["external-dns"]
  token_policies                   = [vault_policy.external_dns_read.name]
}

resource "vault_kv_secret_v2" "external_dns" {
  mount = "platform"
  name  = "external-dns"

  data_json = jsonencode({
  })

  lifecycle {
    ignore_changes = [data_json]
  }
}
