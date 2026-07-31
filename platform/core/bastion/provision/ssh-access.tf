# CA for SSH is generated account wide see https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/use-cases/ssh/ssh-infrastructure-access/#7-configure-ssh-server
# Not available in terraform

data "hcloud_servers" "all" {}

data "cloudflare_zero_trust_device_posture_rules" "device_posture_rules" {
  account_id = var.cloudflare_account_id
}

locals {
  targets = {
    for s in data.hcloud_servers.all.servers :
    s.name => try(
      [for n in s.network : n.ip][0],
      null
    )
    if length(s.network) > 0
  }
  gateway_posture_rule = one([
    for r in data.cloudflare_zero_trust_device_posture_rules.device_posture_rules.result :
    r if r.type == "gateway"
  ])
}

resource "cloudflare_zero_trust_access_application" "ssh_infra" {
  account_id = var.cloudflare_account_id
  name       = "SSH infra"
  type       = "infrastructure"

  target_criteria = [{
    port     = 22
    protocol = "SSH"
    target_attributes = {
      hostname = keys(local.targets)
    }
  }]

  policies = [{
    name     = "SSH Access Policy"
    decision = "allow"
    include = [{
      email = {
        email = var.email_ssh_access
      }
    }]

    require = [{
      device_posture = {
        integration_uid = local.gateway_posture_rule.id
      }
    }]

    connection_rules = {
      ssh = {
        usernames         = ["ci", "root", "engineer"]
        allow_email_alias = false
      }
    }
  }]

  lifecycle {
    precondition {
      condition     = local.gateway_posture_rule.id != null
      error_message = "No device posture rule of type 'gateway' found in this account."
    }
  }
}

resource "cloudflare_zero_trust_access_infrastructure_target" "servers" {
  for_each   = local.targets
  account_id = var.cloudflare_account_id
  hostname   = each.key

  ip = {
    ipv4 = {
      ip_addr = each.value
    }
  }
}
