variable "vault_token" {
  description = "vault token"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account id"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone id"
  type        = string
}
