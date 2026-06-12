terraform {
  required_providers {
    coder = {
      source  = "coder/coder"
      version = "~> 2.18"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 3.2.1"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.21.1"
    }
  }
}

provider "coder" {}
provider "kubernetes" {}

variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "cloudflare_account_id" {
  type = string
}

variable "cloudflare_zone_id" {
  type = string
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

locals {
  home_directory = "/root"
  workspace_slug = "${data.coder_workspace_owner.me.name}-${data.coder_workspace.me.name}"
  repo_folder    = "${local.home_directory}/${trimsuffix(basename(data.coder_parameter.repo_url.value), ".git")}"
  namespace      = "workspaces"

  node_version    = "24.15.0"
  pnpm_version    = "11.9.0"
  kubectl_version = "v1.35.5"

  # local_apps keeps a full url (including port) per app
  local_apps = {
    portfolio = { display_name = "Portfolio", url = "http://portfolio.localhost", order = 1 }
    tilt      = { display_name = "Tilt UI", url = "http://localhost:10350", order = 2 }
  }

  tunnel_name = "coder-${local.workspace_slug}"

  app_hostnames = {
    for app_key, app in local.local_apps :
    app_key => "${app_key}-${local.workspace_slug}-coder.kbntx.com"
  }
}

data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

data "coder_parameter" "repo_url" {
  name         = "repo_url"
  display_name = "Repository URL"
  description  = "Git repository to clone into the workspace (e.g. https://github.com/org/repo)."
  type         = "string"
  mutable      = false
  default      = "https://github.com/kbntx-org/nexus"
}

data "coder_external_auth" "primary_github" {
  id = "primary-github"
}

# ---------------------------------------------------------------------------
# Cloudflare Tunnel — one per workspace
# ---------------------------------------------------------------------------

resource "cloudflare_zero_trust_tunnel_cloudflared" "workspace" {
  count      = data.coder_workspace.me.start_count
  account_id = var.cloudflare_account_id
  name       = local.tunnel_name
}

data "cloudflare_zero_trust_tunnel_cloudflared_token" "workspace" {
  count      = data.coder_workspace.me.start_count
  account_id = var.cloudflare_account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.workspace[0].id
}

resource "cloudflare_zero_trust_tunnel_cloudflared_config" "workspace" {
  count      = data.coder_workspace.me.start_count
  account_id = var.cloudflare_account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.workspace[0].id

  config = {
    ingress = concat(
      [
        for app_key, app in local.local_apps : {
          hostname = local.app_hostnames[app_key]
          service  = app.url
        }
      ],
      [
        { service = "http_status:404" }
      ]
    )
  }
}

resource "cloudflare_dns_record" "app_dns" {
  for_each = data.coder_workspace.me.start_count == 1 ? local.local_apps : {}

  zone_id = var.cloudflare_zone_id
  name    = local.app_hostnames[each.key]
  type    = "CNAME"
  content = "${cloudflare_zero_trust_tunnel_cloudflared.workspace[0].id}.cfargotunnel.com"
  ttl     = 1
  proxied = true
}

# ---------------------------------------------------------------------------
# coder_agent
# ---------------------------------------------------------------------------

resource "coder_agent" "main" {
  os   = "linux"
  arch = "amd64"
  auth = "token"

  env = {
    DOCKER_HOST = "unix:///var/run/docker.sock"
  }

  startup_script = <<-EOT
    #!/bin/bash
    set -euo pipefail
    export DEBIAN_FRONTEND=noninteractive

    apt-get update -q
    apt-get install -y -q curl git build-essential ca-certificates gnupg jq python3

    export NVM_DIR="$HOME/.nvm"
    if [ ! -s "$NVM_DIR/nvm.sh" ]; then
      curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
    fi
    . "$NVM_DIR/nvm.sh"
    nvm install "${local.node_version}"
    nvm alias default "${local.node_version}"
    nvm use default

    npm install -g "pnpm@${local.pnpm_version}"
    npm install -g @withgraphite/graphite-cli@stable

    if ! command -v docker >/dev/null 2>&1; then
      docker_version="27.5.1"
      curl -fsSLo /tmp/docker.tgz "https://download.docker.com/linux/static/stable/x86_64/docker-$${docker_version}.tgz"
      tar -xzf /tmp/docker.tgz --strip-components=1 -C /usr/local/bin docker/docker
      rm -f /tmp/docker.tgz
    fi

    if ! command -v tilt >/dev/null 2>&1; then
      curl -fsSL https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.sh | bash
    fi

    if ! command -v kind >/dev/null 2>&1; then
      curl -fsSLo /tmp/kind https://kind.sigs.k8s.io/dl/v0.32.0/kind-linux-amd64
      install -m 0755 /tmp/kind /usr/local/bin/kind && rm -f /tmp/kind
    fi

    if ! command -v kubectl >/dev/null 2>&1; then
      curl -fsSLo /tmp/kubectl "https://dl.k8s.io/release/${local.kubectl_version}/bin/linux/amd64/kubectl"
      install -m 0755 /tmp/kubectl /usr/local/bin/kubectl && rm -f /tmp/kubectl
    fi

    if ! command -v helm >/dev/null 2>&1; then
      curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    fi

    repo_url="${data.coder_parameter.repo_url.value}"
    if [ -n "$repo_url" ]; then
      dest="$HOME/$(basename "$repo_url" .git)"
      if [ ! -d "$dest/.git" ]; then
        git clone "$repo_url" "$dest"
      fi
    fi

    cd "${local.repo_folder}"
    pnpm install
    pnpm cluster:create

    code-server --install-extension pkief.material-icon-theme

    EXTENSIONS=(
      angular.ng-template
      anthropic.claude-code
      bradlc.vscode-tailwindcss
      christian-kohler.path-intellisense
      dbaeumer.vscode-eslint
      docker.docker
      eamodio.gitlens
      editorconfig.editorconfig
      esbenp.prettier-vscode
      firsttris.vscode-jest-runner
      github.github-vscode-theme
      github.remotehub
      github.vscode-github-actions
      github.vscode-pull-request-github
      golang.go
      graphite.gti-vscode
      hashicorp.terraform
      mhutchie.git-graph
      mrmlnc.vscode-scss
      ms-azuretools.vscode-containers
      ms-kubernetes-tools.vscode-kubernetes-tools
      ms-ossdata.vscode-pgsql
      ms-python.black-formatter
      ms-python.debugpy
      ms-python.python
      ms-python.vscode-pylance
      ms-python.vscode-python-envs
      redhat.vscode-yaml
      tilt-dev.tiltfile
      typescriptteam.native-preview
    )

    for ext in "$${EXTENSIONS[@]}"; do
      code-server --install-extension "$${ext}" || echo "skipped: $${ext}"
    done

    mkdir -p ~/.local/share/code-server/User
    cat > ~/.local/share/code-server/User/settings.json <<'SETTINGS'
    {
      "workbench.colorTheme": "Default Dark Modern",
      "workbench.iconTheme": "material-icon-theme"
    }
    SETTINGS
  EOT

  metadata {
    display_name = "CPU usage"
    key          = "cpu"
    script       = "coder stat cpu"
    interval     = 10
    timeout      = 1
  }

  metadata {
    display_name = "Memory usage"
    key          = "mem"
    script       = "coder stat mem"
    interval     = 10
    timeout      = 1
  }

  metadata {
    display_name = "Home disk"
    key          = "disk"
    script       = "coder stat disk --path $${HOME}"
    interval     = 60
    timeout      = 1
  }
}

module "code-server" {
  source   = "registry.coder.com/coder/code-server/coder"
  version  = "~> 1.5"
  count    = data.coder_workspace.me.start_count
  agent_id = coder_agent.main.id
  folder   = local.repo_folder
  order    = 1
}

# ---------------------------------------------------------------------------
# coder_app — now points at the real public URL via the tunnel
# ---------------------------------------------------------------------------

resource "coder_app" "apps" {
  for_each = data.coder_workspace.me.start_count == 1 ? local.local_apps : {}

  agent_id     = coder_agent.main.id
  slug         = each.key
  display_name = each.value.display_name
  url          = "https://${local.app_hostnames[each.key]}"
  external     = true
  icon         = "/icon/widgets.svg"
  order        = each.value.order
}

resource "kubernetes_persistent_volume_claim_v1" "home" {
  metadata {
    name      = "coder-${data.coder_workspace.me.id}-home"
    namespace = local.namespace
    labels = {
      "app.kubernetes.io/name"     = "coder-pvc"
      "app.kubernetes.io/instance" = "coder-pvc-${data.coder_workspace.me.id}"
      "app.kubernetes.io/part-of"  = "coder"
      "com.coder.resource"         = "true"
      "com.coder.workspace.id"     = data.coder_workspace.me.id
      "com.coder.workspace.name"   = data.coder_workspace.me.name
      "com.coder.user.id"          = data.coder_workspace_owner.me.id
      "com.coder.user.username"    = data.coder_workspace_owner.me.name
    }
    annotations = {
      "com.coder.user.email" = data.coder_workspace_owner.me.email
    }
  }
  wait_until_bound = false
  spec {
    access_modes       = ["ReadWriteOnce"]
    storage_class_name = "local-path"
    resources {
      requests = {
        storage = "20Gi"
      }
    }
  }
}

# ---------------------------------------------------------------------------
# Tunnel token as a Secret, so cloudflared sidecar can authenticate
# ---------------------------------------------------------------------------

resource "kubernetes_secret_v1" "tunnel_token" {
  count = data.coder_workspace.me.start_count

  metadata {
    name      = "coder-${data.coder_workspace.me.id}-tunnel-token"
    namespace = local.namespace
  }

  data = {
    token = data.cloudflare_zero_trust_tunnel_cloudflared_token.workspace[0].token
  }
}

resource "kubernetes_deployment_v1" "main" {
  count            = data.coder_workspace.me.start_count
  wait_for_rollout = false
  depends_on       = [kubernetes_persistent_volume_claim_v1.home]

  metadata {
    name      = "coder-${data.coder_workspace.me.id}"
    namespace = local.namespace
    labels = {
      "app.kubernetes.io/name"     = "coder-workspace"
      "app.kubernetes.io/instance" = "coder-workspace-${data.coder_workspace.me.id}"
      "app.kubernetes.io/part-of"  = "coder"
      "com.coder.resource"         = "true"
      "com.coder.workspace.id"     = data.coder_workspace.me.id
      "com.coder.workspace.name"   = data.coder_workspace.me.name
      "com.coder.user.id"          = data.coder_workspace_owner.me.id
      "com.coder.user.username"    = data.coder_workspace_owner.me.name
    }
    annotations = {
      "com.coder.user.email" = data.coder_workspace_owner.me.email
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        "app.kubernetes.io/instance" = "coder-workspace-${data.coder_workspace.me.id}"
      }
    }
    strategy {
      type = "Recreate"
    }

    template {
      metadata {
        labels = {
          "app.kubernetes.io/name"     = "coder-workspace"
          "app.kubernetes.io/instance" = "coder-workspace-${data.coder_workspace.me.id}"
          "app.kubernetes.io/part-of"  = "coder"
          "com.coder.resource"         = "true"
          "com.coder.workspace.id"     = data.coder_workspace.me.id
          "com.coder.workspace.name"   = data.coder_workspace.me.name
          "com.coder.user.id"          = data.coder_workspace_owner.me.id
          "com.coder.user.username"    = data.coder_workspace_owner.me.name
        }
      }

      spec {
        node_selector = {
          "pool" = "workspace"
        }

        toleration {
          key      = "workspace"
          operator = "Equal"
          value    = "true"
          effect   = "NoSchedule"
        }

        container {
          name  = "workspace"
          image = "debian:12.14-slim"
          command = [
            "sh",
            "-c",
            "apt-get update -q && apt-get install -y -q curl sudo ca-certificates && ${coder_agent.main.init_script}"
          ]

          env {
            name  = "CODER_AGENT_TOKEN"
            value = coder_agent.main.token
          }
          env {
            name  = "DOCKER_HOST"
            value = "unix:///var/run/docker.sock"
          }

          volume_mount {
            name       = "home"
            mount_path = local.home_directory
            read_only  = false
          }

          volume_mount {
            name       = "docker-sock"
            mount_path = "/var/run"
            read_only  = false
          }
        }

        container {
          name  = "dockerd"
          image = "docker:29.6.0-dind"

          security_context {
            privileged = true
          }

          volume_mount {
            name       = "home"
            mount_path = local.home_directory
            read_only  = false
          }

          volume_mount {
            name       = "docker-storage"
            mount_path = "/var/lib/docker"
          }

          volume_mount {
            name       = "docker-sock"
            mount_path = "/var/run"
            read_only  = false
          }
        }

        # ---------------------------------------------------------------
        # cloudflared sidecar — connects out to Cloudflare, no inbound
        # ports/ingress needed on the k8s side at all
        # ---------------------------------------------------------------
        container {
          name  = "cloudflared"
          image = "cloudflare/cloudflared:latest"
          args = [
            "tunnel",
            "--no-autoupdate",
            "run",
            "--token",
            "$(TUNNEL_TOKEN)",
          ]

          env {
            name = "TUNNEL_TOKEN"
            value_from {
              secret_key_ref {
                name = kubernetes_secret_v1.tunnel_token[0].metadata[0].name
                key  = "token"
              }
            }
          }
        }

        volume {
          name = "home"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim_v1.home.metadata[0].name
            read_only  = false
          }
        }

        volume {
          name = "docker-storage"
          empty_dir {}
        }

        volume {
          name = "docker-sock"
          empty_dir {}
        }

        affinity {
          pod_anti_affinity {
            preferred_during_scheduling_ignored_during_execution {
              weight = 1
              pod_affinity_term {
                topology_key = "kubernetes.io/hostname"
                label_selector {
                  match_expressions {
                    key      = "app.kubernetes.io/name"
                    operator = "In"
                    values   = ["coder-workspace"]
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
