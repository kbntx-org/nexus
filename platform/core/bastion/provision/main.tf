data "hcloud_network" "main_vpc" {
  name = "main-vpc"
}

module "bastion" {
  source = "../../../modules/vps"

  name        = "bastion"
  server_type = "cx23"
  image       = "ubuntu-24.04"
  location    = "nbg1"
  vpc_id      = data.hcloud_network.main_vpc.id
  labels = {
    "app" = "bastion"
  }
}

module "bastion_firewall" {
  source = "../../../modules/firewall"
  name   = "bastion-firewall"

  ingress_rules = [
    { protocol = "tcp", port = "22", source_ips = [data.hcloud_network.main_vpc.ip_range] },
  ]

  label_selector = "app=bastion"
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
