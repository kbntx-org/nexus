variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "name" {
  description = "Name of the server"
  type        = string
}

variable "server_type" {
  description = "Type of the server"
  type        = string
}

variable "image" {
  description = "Image of the server"
  type        = string
}

variable "location" {
  description = "Location of the server"
  type        = string
}

variable "labels" {
  description = "Labels of the server"
  type        = map(string)
  default     = {}
}

variable "private_ip" {
  description = "Static private IP to assign within the VPC. Leave null to let Hetzner assign one."
  type        = string
  default     = null
}

variable "use_as_nat" {
  description = "Whether this server acts as the NAT gateway for the VPC, masquerading traffic from private-network peers"
  type        = bool
  default     = false
}

variable "floating_ip" {
  description = "Floating IP address that will be assigned to this server. When set, disables the ephemeral public IPv4 so the Floating IP is the server's sole stable public address. Leave empty to keep the default ephemeral public IPv4."
  type        = string
  default     = ""
}
