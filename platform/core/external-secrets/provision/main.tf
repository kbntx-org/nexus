resource "vault_auth_backend" "kubernetes" {
  type = "kubernetes"
}

resource "vault_kubernetes_auth_backend_config" "kubernetes" {
  backend         = vault_auth_backend.kubernetes.path
  kubernetes_host = "https://nexus-control-plane.kbntx.com:6443"
}

resource "vault_policy" "eso_templated" {
  name = "eso-templated"

  policy = <<-EOT
    path "platform/data/{{identity.entity.aliases.${vault_auth_backend.kubernetes.accessor}.metadata.service_account_namespace}}" {
      capabilities = ["read"]
    }

    path "platform/data/{{identity.entity.aliases.${vault_auth_backend.kubernetes.accessor}.metadata.service_account_namespace}}/*" {
      capabilities = ["read"]
    }
  EOT
}

resource "vault_kubernetes_auth_backend_role" "eso" {
  backend                          = vault_auth_backend.kubernetes.path
  role_name                        = "eso"
  bound_service_account_names      = ["*"]
  bound_service_account_namespaces = ["*"]
  token_policies                   = [vault_policy.eso_templated.name]
  audience                         = "vault"
}
