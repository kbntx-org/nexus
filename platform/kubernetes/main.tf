data "hcloud_network" "main_network" {
  name = "main-vpc"
}

module "nexus_cluster" {
  source = "../terraform-modules/k3s"

  cluster_name            = "nexus"
  vpc_name                = "main-vpc"
  hcloud_token            = var.hcloud_token
  cloudflare_tunnel_token = var.cloudflare_tunnel_token
  docker_hub_username     = var.docker_hub_username
  docker_hub_password     = var.docker_hub_password

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
      server_type = "cx33"
      location    = "fsn1"
    }
    "ci-runners" = {
      count       = 1
      server_type = "cx33"
      location    = "nbg1"
      labels = {
        "pool" = "ci-runners"
      }
      taints = [
        {
          key    = "ci-runners"
          value  = "true"
          effect = "NoSchedule"
        }
      ]
    }
  }
}

module "control_plane_firewall" {
  source = "../terraform-modules/firewall"
  name   = "nexus-control-plane-firewall"

  ingress_rules = [
    { protocol = "tcp", port = "22", source_ips = ["10.0.0.0/16"] },
    { protocol = "tcp", port = "6443", source_ips = ["10.0.0.0/16"] }
  ]

  label_selector = "type=control-plane,cluster-name=nexus"
}

module "worker_nodes_firewall" {
  source = "../terraform-modules/firewall"
  name   = "nexus-worker-nodes-firewall"

  ingress_rules = [
    { protocol = "tcp", port = "22", source_ips = ["10.0.0.0/16"] }
  ]

  label_selector = "type=worker,cluster-name=nexus"
}

output "cluster_token" {
  value     = module.nexus_cluster.cluster_token
  sensitive = true
}
