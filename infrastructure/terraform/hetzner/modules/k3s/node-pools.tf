locals {
  flattened_node_pools = merge([
    for pool_key, pool in var.node_pools : {
      for i in range(pool.count) : "${pool_key}-${i}" => merge(pool, {
        pool_key     = pool_key
        index        = i
        cluster_name = var.cluster_name
        name         = "${var.cluster_name}-${pool_key}-${i}"
      })
    }
  ]...)
}

resource "hcloud_server" "node_pool" {
  for_each = local.flattened_node_pools

  name                     = each.value.name
  server_type              = each.value.server_type
  image                    = "ubuntu-24.04"
  location                 = each.value.location
  keep_disk                = true
  shutdown_before_deletion = true
  user_data                = data.cloudinit_config.node_pool[each.value.pool_key].rendered
  placement_group_id       = hcloud_placement_group.cluster_placement_group.id
  ssh_keys                 = [var.default_user.ssh_key_id]

  network {
    network_id = data.hcloud_network.main_network.id
    alias_ips  = []
  }

  labels = merge({
    "type" : "worker"
    "pool" : each.value.pool_key
    "cluster-name" : var.cluster_name
  }, coalesce(each.value.labels, local.node_pool_defaults.labels))

  connection {
    type    = "ssh"
    user    = "root"
    agent   = true
    timeout = "10m"
    host    = self.ipv4_address
  }

  provisioner "remote-exec" {
    inline = [
      "echo 'Waiting for user data script to finish'",
      "cloud-init status --wait > /dev/null",
      "exit 0"
    ]
  }

  lifecycle {
    ignore_changes = [user_data, ssh_keys]
  }
}


data "cloudinit_config" "node_pool" {
  for_each = var.node_pools

  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    filename     = "cloud-config.yml"
    content = templatefile("${path.module}/config/cloud-init.yml", merge(local.cloud_init_base, {
      server_address = hcloud_server_network.control_plane_network.ip
      taints         = coalesce(each.value.taints, local.node_pool_defaults.taints)
      type           = "worker"
    }))
  }
}

resource "null_resource" "deploy_core_cluster_charts" {
  depends_on = [
    hcloud_server.node_pool
  ]

  connection {
    type    = "ssh"
    user    = var.default_user.name
    agent   = true
    host    = hcloud_server.control_plane.ipv4_address
    timeout = "10m"
  }

  provisioner "file" {
    source      = "${path.module}/config/init-core-charts.sh"
    destination = "/tmp/init-core-charts.sh"
  }

  provisioner "file" {
    source      = "${path.root}/../../../kubernetes/argocd"
    destination = "/tmp"
  }

  provisioner "file" {
    source      = "${path.root}/../../../kubernetes/cloudflared"
    destination = "/tmp"
  }

  provisioner "file" {
    source      = "${path.root}/../../../kubernetes/ingress-nginx"
    destination = "/tmp"
  }

  provisioner "remote-exec" {
    inline = [
      "export KUBECONFIG=/home/${var.default_user.name}/.kube/config",
      "echo 'Waiting for worker nodes to be ready'",
      "kubectl wait --for=condition=Ready nodes --all --timeout=300s",
      "echo 'Deploying cluster core charts'",
      "chmod +x /tmp/init-core-charts.sh",
      "/tmp/init-core-charts.sh ${nonsensitive(var.cloudflare_tunnel_token)}",
      "echo 'Cluster core charts deployed'",
      "rm -rf /tmp/init-core-charts.sh"
    ]
  }
}
