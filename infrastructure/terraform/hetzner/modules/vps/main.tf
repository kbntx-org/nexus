resource "hcloud_server" "this" {
  name                     = var.name
  server_type              = var.server_type
  image                    = var.image
  location                 = var.location
  keep_disk                = true
  shutdown_before_deletion = true
  user_data                = data.cloudinit_config.this.rendered
  ssh_keys                 = [var.default_user.ssh_key_id]
  labels                   = var.labels

  network {
    network_id = var.vpc_id
  }
}

data "cloudinit_config" "this" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    filename     = "cloud-config.yml"
    content = templatefile("${path.module}/config/cloud-init.yml", {
      default_user     = var.default_user.name
      default_ssh_key  = var.default_user.ssh_key
      additional_users = var.additional_users
    })
  }
}
