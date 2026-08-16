locals {
  cloud_init_base = {
    cloudflare_access_ssh_ca_public_key = file("${path.module}/config/ca.pub")
    init_script_b64                     = base64encode(file("${path.module}/config/init-core-cluster-dependencies.sh"))
    nat_ip                              = var.nat_gateway_ip
    network_gateway_ip                  = var.network_gateway_ip
  }

  node_pool_defaults = {
    taints = []
    labels = {}
  }
}

data "hcloud_network" "main_network" {
  name = var.vpc_name
}
