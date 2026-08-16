resource "hcloud_server" "this" {
  name                     = var.name
  server_type              = var.server_type
  image                    = var.image
  location                 = var.location
  keep_disk                = true
  shutdown_before_deletion = true
  user_data                = data.cloudinit_config.this.rendered
  labels                   = var.labels

  network {
    network_id = var.vpc_id
    ip         = var.private_ip
    alias_ips  = []
  }

  public_net {
    ipv4_enabled = true
    ipv6_enabled = false
  }

  lifecycle {
    ignore_changes = [user_data, ssh_keys]
  }
}

data "hcloud_ssh_key" "ci_key" {
  name = "nexus-ci"
}

data "hcloud_network" "this" {
  id = var.vpc_id
}

data "cloudinit_config" "this" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    filename     = "cloud-config.yml"
    content = templatefile("${path.module}/config/cloud-init.yml", {
      ci_ssh_public_key                   = data.hcloud_ssh_key.ci_key.public_key
      cloudflare_access_ssh_ca_public_key = file("${path.module}/config/ca.pub")
      use_as_nat                          = var.use_as_nat
      vpc_cidr                            = data.hcloud_network.this.ip_range
      floating_ip                         = var.floating_ip
    })
  }
}
