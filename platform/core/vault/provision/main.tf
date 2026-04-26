data "hcloud_network" "main_vpc" {
  name = "main-vpc"
}

module "vault" {
  source = "../../../modules/vps"

  name        = "vault"
  server_type = "cx23"
  image       = "ubuntu-24.04"
  location    = "nbg1"
  vpc_id      = data.hcloud_network.main_vpc.id
  labels = {
    "app" = "vault"
  }
}

module "vault_firewall" {
  source = "../../../modules/firewall"
  name   = "vault-firewall"

  ingress_rules = [
    { protocol = "tcp", port = "22", source_ips = ["10.0.0.0/16"] },
  ]

  label_selector = "app=vault"
}
