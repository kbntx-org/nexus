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

variable "cluster_name" {
  description = "Name of the kubernetes cluster"
  type        = string
}

variable "vpc_name" {
  description = "Name of the VPC"
  type        = string
}

variable "default_user" {
  description = "Default SSH key to use for the servers"
  type = object({
    name       = string
    ssh_key    = string
    ssh_key_id = string
  })
}

variable "control_plane" {
  description = "Control plane node configuration"
  type = object({
    server_type = string
    location    = string
    labels      = map(string)
  })
  default = {
    server_type = "cpx31"
    location    = "fsn1"
    labels      = {}
  }
}

variable "node_pools" {
  description = "Map of node pools configuration"
  type = map(object({
    count       = number
    server_type = string
    location    = string
    labels      = map(string)
    taints = optional(list(object({
      key    = string
      value  = string
      effect = string
    })))
  }))
  default = {}

  validation {
    condition = alltrue([
      for pool in var.node_pools :
      alltrue([
        for taint in coalesce(pool.taints, []) :
        contains(["NoSchedule", "PreferNoSchedule", "NoExecute"], taint.effect)
      ])
    ])
    error_message = "Taint effect must be one of: NoSchedule, PreferNoSchedule, NoExecute"
  }
}
