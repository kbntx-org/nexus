terraform {
  required_version = "~> 1.8.4"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.52"
    }

    null = {
      source  = "hashicorp/null"
      version = "~> 3.2.2"
    }

    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

