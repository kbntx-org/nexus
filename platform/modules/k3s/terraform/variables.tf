variable "cluster_name" {
  description = "Name of the kubernetes cluster"
  type        = string
}

variable "vpc_name" {
  description = "Name of the VPC"
  type        = string
}

variable "nat_gateway_ip" {
  description = "Private IP of the NAT gateway server nodes should route outbound traffic through. Leave empty to skip NAT routing."
  type        = string
  default     = ""
}

variable "network_gateway_ip" {
  description = "Reserved gateway IP of the private network's subnet, used as the next hop for the default route. Hetzner forwards traffic sent here on to the NAT gateway server via the network-level route."
  type        = string
  default     = ""
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
    labels      = optional(map(string), {})
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
