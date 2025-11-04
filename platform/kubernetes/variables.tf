variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_tunnel_token" {
  description = "Cloudflare tunnel token"
  type        = string
  sensitive   = true
}

variable "docker_hub_username" {
  description = "username docker hub"
  type        = string
  sensitive   = true
}

variable "docker_hub_password" {
  description = "password docker hub"
  type        = string
  sensitive   = true
}
