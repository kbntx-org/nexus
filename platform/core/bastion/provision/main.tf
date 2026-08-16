data "hcloud_network" "main_vpc" {
  name = "main-vpc"
}

resource "hcloud_floating_ip" "bastion" {
  type          = "ipv4"
  home_location = "nbg1"
  labels = {
    "app" = "bastion"
  }
}

module "bastion" {
  source = "../../../modules/vps"

  name        = "bastion"
  server_type = "cx23"
  image       = "ubuntu-24.04"
  location    = "nbg1"
  vpc_id      = data.hcloud_network.main_vpc.id
  private_ip  = "10.0.0.5"
  use_as_nat  = true
  floating_ip = hcloud_floating_ip.bastion.ip_address
  labels = {
    "app" = "bastion"
  }
}

resource "hcloud_floating_ip_assignment" "bastion" {
  floating_ip_id = hcloud_floating_ip.bastion.id
  server_id      = module.bastion.server_id
}

module "bastion_firewall" {
  source = "../../../modules/firewall"
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

resource "cloudflare_zero_trust_tunnel_cloudflared" "bastion_tunnel" {
  account_id = var.cloudflare_account_id
  name       = "bastion"
  config_src = "cloudflare"
}

data "cloudflare_zero_trust_tunnel_cloudflared_token" "bastion_tunnel_token" {
  account_id = var.cloudflare_account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.bastion_tunnel.id
}

output "cloudflare_tunnel_token" {
  value     = data.cloudflare_zero_trust_tunnel_cloudflared_token.bastion_tunnel_token.token
  sensitive = true
}

resource "cloudflare_zero_trust_tunnel_cloudflared_route" "vpc_route" {
  account_id = var.cloudflare_account_id
  network    = data.hcloud_network.main_vpc.ip_range
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.bastion_tunnel.id
  comment    = "vpc hetzner"
}
