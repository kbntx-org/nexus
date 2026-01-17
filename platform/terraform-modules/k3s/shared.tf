data "archive_file" "chart_hetzner_cloud_controller" {
  type        = "tar.gz"
  source_dir  = "${path.root}/../hetzner-cloud-controller"
  output_path = "${path.root}/.generated/chart-hetzner-cloud-controller.tar.gz"
  excludes    = ["charts"]
}

data "archive_file" "chart_argocd" {
  type        = "tar.gz"
  source_dir  = "${path.root}/../argocd"
  output_path = "${path.root}/.generated/chart-argocd.tar.gz"
  excludes    = ["charts"]
}

locals {
  cluster_token = random_password.cluster_token.result

  cloud_init_base = {
    cluster_token                       = local.cluster_token
    cloudflare_access_ssh_ca_public_key = file("${path.module}/config/ca.pub")
    docker_hub_username                 = ""
    docker_hub_password                 = ""
    init_script_b64                     = base64encode(file("${path.module}/config/init-core-cluster-dependencies.sh"))
    hcloud_token                        = var.hcloud_token
    vpc_name                            = var.vpc_name
    cloudflare_tunnel_token             = var.cloudflare_tunnel_token
    chart_hetzner_cloud_controller_b64  = filebase64(data.archive_file.chart_hetzner_cloud_controller.output_path)
    chart_argocd_b64                    = filebase64(data.archive_file.chart_argocd.output_path)
  }

  node_pool_defaults = {
    taints = []
    labels = {}
  }
}

data "hcloud_network" "main_network" {
  name = var.vpc_name
}
