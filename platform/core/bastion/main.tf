data "hcloud_network" "main_vpc" {
  name = "main-vpc"
}

locals {
  bastion_private_ip = "10.0.0.5"
}

resource "hcloud_floating_ip" "bastion" {
  type          = "ipv4"
  home_location = "nbg1"
  labels = {
    "app" = "bastion"
  }
}

resource "cloudflare_zero_trust_tunnel_cloudflared" "bastion_tunnel" {
  account_id = var.cloudflare_account_id
  name       = "bastion"
  config_src = "cloudflare"
}

data "cloudflare_zero_trust_tunnel_cloudflared_token" "bastion_tunnel_token" {
  account_id = var.cloudflare_account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.bastion_tunnel.id
}

resource "cloudflare_zero_trust_tunnel_cloudflared_route" "vpc_route" {
  account_id = var.cloudflare_account_id
  network    = data.hcloud_network.main_vpc.ip_range
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.bastion_tunnel.id
  comment    = "vpc hetzner"
}

data "hcloud_ssh_key" "nexus_ci" {
  name = "nexus-ci"
}

data "cloudinit_config" "bastion" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    filename     = "cloud-config.yml"
    content = templatefile("${path.module}/config/cloud-init.yml", {
      cloudflare_access_ssh_ca_public_key = file("${path.module}/config/ca.pub")
      vpc_cidr                            = data.hcloud_network.main_vpc.ip_range
      floating_ip                         = hcloud_floating_ip.bastion.ip_address
      cloudflare_tunnel_token             = data.cloudflare_zero_trust_tunnel_cloudflared_token.bastion_tunnel_token.token
      nexus_ci_public_key                 = data.hcloud_ssh_key.nexus_ci.public_key
    })
  }
}

resource "hcloud_server" "bastion" {
  name                     = "bastion"
  server_type              = "cx23"
  image                    = "ubuntu-24.04"
  location                 = "nbg1"
  keep_disk                = true
  shutdown_before_deletion = true
  user_data                = data.cloudinit_config.bastion.rendered
  ssh_keys                 = [data.hcloud_ssh_key.nexus_ci.id]
  labels = {
    "app" = "bastion"
  }

  network {
    network_id = data.hcloud_network.main_vpc.id
    ip         = local.bastion_private_ip
    alias_ips  = []
  }

  public_net {
    ipv4_enabled = true
    ipv6_enabled = false
  }
}

resource "hcloud_floating_ip_assignment" "bastion" {
  floating_ip_id = hcloud_floating_ip.bastion.id
  server_id      = hcloud_server.bastion.id
}

module "bastion_firewall" {
  source = "../../modules/firewall"
  name   = "bastion-firewall"

  ingress_rules = [
    { protocol = "tcp", port = "any", source_ips = [data.hcloud_network.main_vpc.ip_range] },
    { protocol = "udp", port = "any", source_ips = [data.hcloud_network.main_vpc.ip_range] },
    { protocol = "icmp", port = "", source_ips = [data.hcloud_network.main_vpc.ip_range] },
  ]

  label_selector = "app=bastion"
}

output "bastion_floating_ip" {
  value = hcloud_floating_ip.bastion.ip_address
}
