resource "vault_policy" "cert_manager_read" {
  name = "cert-manager-read"

  policy = <<-EOT
    path "platform/data/cert-manager" {
      capabilities = ["read"]
    }
  EOT
}

resource "vault_kubernetes_auth_backend_role" "cert_manager" {
  backend                          = "kubernetes"
  role_name                        = "cert-manager"
  bound_service_account_names      = ["cert-manager-secret-sa"]
  bound_service_account_namespaces = ["cert-manager"]
  token_policies                   = [vault_policy.cert_manager_read.name]
}

resource "vault_kv_secret_v2" "cert_manager" {
  mount = "platform"
  name  = "cert-manager"

  data_json = jsonencode({
  })

  lifecycle {
    ignore_changes = [data_json]
  }
}
