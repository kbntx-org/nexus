data "hcloud_ssh_key" "default_ssh_key" {
  with_selector = "default=true"
}

data "hcloud_network" "main_network" {
  name = "main-vpc"
}

module "nexus_cluster" {
  source = "../modules/k3s"

  cluster_name            = "nexus"
  vpc_name                = "main-vpc"
  hcloud_token            = var.hcloud_token
  cloudflare_tunnel_token = var.cloudflare_tunnel_token

  default_user = {
    name       = "kenny"
    ssh_key_id = data.hcloud_ssh_key.default_ssh_key.id
    ssh_key    = data.hcloud_ssh_key.default_ssh_key.public_key
  }

  control_plane = {
    server_type = "cpx31"
    location    = "fsn1"
    labels = {
      "node-type"   = "control-plane"
      "environment" = "production"
    }
  }

  node_pools = {
    "default" = {
      count       = 3
      server_type = "cpx21"
      location    = "fsn1"
      labels = {
        "pool" = "default"
      }
    }
  }
}

module "control_plane_firewall" {
  source = "../modules/firewall"
  name   = "nexus-control-plane-firewall"

  ingress_rules = [
    { protocol = "tcp", port = "22", source_ips = ["10.0.0.0/16"] },
    { protocol = "tcp", port = "6443", source_ips = ["10.0.0.0/16"] }
  ]

  label_selector = "type=control-plane,cluster-name=nexus"
}

module "worker_nodes_firewall" {
  source = "../modules/firewall"
  name   = "nexus-worker-nodes-firewall"

  ingress_rules = [
    { protocol = "tcp", port = "22", source_ips = ["10.0.0.0/16"] }
  ]

  label_selector = "type=worker,cluster-name=nexus"
}
