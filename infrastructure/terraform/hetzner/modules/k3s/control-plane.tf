resource "random_password" "cluster_token" {
  length  = 64
  special = false
  upper   = true
  lower   = true
  numeric = true
}

resource "hcloud_server" "control_plane" {
  name                     = "${var.cluster_name}-k3s-control-plane"
  server_type              = var.control_plane.server_type
  image                    = "ubuntu-24.04"
  location                 = var.control_plane.location
  keep_disk                = true
  shutdown_before_deletion = true
  user_data                = data.cloudinit_config.control_plane.rendered
  placement_group_id       = hcloud_placement_group.cluster_placement_group.id
  ssh_keys                 = [var.default_user.ssh_key_id]

  network {
    network_id = data.hcloud_network.main_network.id
    alias_ips  = []
  }

  labels = merge({
    "type" : "control-plane"
    "cluster-name" : var.cluster_name
  }, var.control_plane.labels)

  connection {
    type    = "ssh"
    user    = "root"
    agent   = true
    timeout = "10m"
    host    = self.ipv4_address
  }

  provisioner "file" {
    source      = "${path.module}/config/init-core-cluster-dependencies.sh"
    destination = "/tmp/init-core-cluster-dependencies.sh"
  }

  provisioner "file" {
    source      = "${path.root}/../../../kubernetes/hetzner-cloud-controller"
    destination = "/tmp"
  }

  provisioner "remote-exec" {
    inline = [
      "echo 'Waiting for user data script to finish'",
      "cloud-init status --wait > /dev/null",
      "echo 'Cluster dependencies installation starting'",
      "chmod +x /tmp/init-core-cluster-dependencies.sh",
      "/tmp/init-core-cluster-dependencies.sh ${nonsensitive(var.hcloud_token)} ${var.vpc_name}",
      "echo 'Cluster dependencies installed'",
      "mkdir -p /home/${var.default_user.name}/.kube",
      "cp /etc/rancher/k3s/k3s.yaml /home/${var.default_user.name}/.kube/config",
      "chown ${var.default_user.name}:${var.default_user.name} /home/${var.default_user.name}/.kube/config",
      "chmod 600 /home/${var.default_user.name}/.kube/config",
      "rm -rf /tmp/init-core-cluster-dependencies.sh",
      "exit 0"
    ]
  }

  lifecycle {
    ignore_changes = [user_data, ssh_keys]
  }
}

resource "hcloud_server_network" "control_plane_network" {
  server_id  = hcloud_server.control_plane.id
  network_id = data.hcloud_network.main_network.id
}

resource "hcloud_placement_group" "cluster_placement_group" {
  name = "${var.cluster_name}-k3s-placement-group"
  type = "spread"
}


output "cluster_token" {
  description = "The generated cluster token"
  value       = random_password.cluster_token.result
  sensitive   = true
}

data "cloudinit_config" "control_plane" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    filename     = "cloud-config.yml"
    content = templatefile("${path.module}/config/cloud-init.yml", merge(local.cloud_init_base, {
      server_address = ""
      type           = "control-plane"
      taints         = []
    }))
  }
}
