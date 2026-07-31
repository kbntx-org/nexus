terraform {
  required_version = "~> 1.15.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5"
    }
    vault = {
      source  = "hashicorp/vault"
      version = "~> 5"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "vault" {
  address = "http://localhost:8200"
  token   = var.vault_token
}

terraform {
  backend "s3" {
    endpoints = {
      s3 = "https://2bde0126da63a3a9c94029d14ea380db.eu.r2.cloudflarestorage.com"
    }
    bucket                      = "nexus-terraform-state"
    key                         = "k3s-entrypoint-cloudflared/state/terraform.tfstate"
    region                      = "eeur"
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
    use_path_style              = true
  }
}

