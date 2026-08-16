data "hcloud_network" "main_network" {
  name = "main-vpc"
}

data "hcloud_server" "bastion" {
  with_selector = "app=bastion"
}

locals {
  # Hetzner gateway in vpc is on X.X.X.1
  network_gateway_ip = cidrhost(data.hcloud_network.main_network.ip_range, 1)
}

module "nexus_cluster" {
  source = "../../../modules/k3s/terraform"

  cluster_name       = "nexus"
  vpc_name           = "main-vpc"
  nat_gateway_ip     = one(data.hcloud_server.bastion.network).ip
  network_gateway_ip = local.network_gateway_ip

  control_plane = {
    server_type = "cx33"
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
        "pool"           = "ci-runners"
        "sysbox-install" = "yes"
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
  source = "../../../modules/firewall"
  name   = "nexus-control-plane-firewall"

  ingress_rules = [
    { protocol = "tcp", port = "22", source_ips = ["10.0.0.0/16"] },
    { protocol = "tcp", port = "6443", source_ips = ["10.0.0.0/16"] }
  ]

  label_selector = "type=control-plane,cluster-name=nexus"
}

module "worker_nodes_firewall" {
  source = "../../../modules/firewall"
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
