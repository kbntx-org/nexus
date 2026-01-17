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


  network {
    network_id = data.hcloud_network.main_network.id
    alias_ips  = []
  }

  labels = merge({
    "type" : "worker"
    "pool" : each.value.pool_key
    "cluster-name" : var.cluster_name
  }, coalesce(each.value.labels, local.node_pool_defaults.labels))

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
      server_address      = hcloud_server_network.control_plane_network.ip
      labels              = merge(coalesce(each.value.labels, {}), local.node_pool_defaults.labels)
      taints              = coalesce(each.value.taints, local.node_pool_defaults.taints)
      type                = "worker"
      docker_hub_username = var.docker_hub_username
      docker_hub_password = var.docker_hub_password
    }))
  }
}
