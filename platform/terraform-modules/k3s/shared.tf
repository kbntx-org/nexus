locals {
  cluster_token = random_password.cluster_token.result

  cloud_init_base = {
    default_ssh_key     = var.default_user.ssh_key
    default_user        = var.default_user.name
    cluster_token       = local.cluster_token
    docker_hub_username = ""
    docker_hub_password = ""
  }

  node_pool_defaults = {
    taints = []
    labels = {}
  }
}

data "hcloud_network" "main_network" {
  name = var.vpc_name
}
