terraform {
  required_version = "~> 1.8.4"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.52"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

terraform {
  backend "s3" {
    endpoints = {
      s3 = "https://fsn1.your-objectstorage.com"
    }
    bucket                      = "nexus-terraform-state"
    key                         = "bastion/state/terraform.tfstate"
    region                      = "fra1"
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
    use_path_style              = true
  }
}

