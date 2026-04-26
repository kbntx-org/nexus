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
    { protocol = "tcp", port = "22", source_ips = ["10.0.0.0/16"] },
  ]

  label_selector = "app=bastion"
}
