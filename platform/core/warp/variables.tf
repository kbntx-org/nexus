variable "cloudflare_api_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account id"
  type        = string
}
