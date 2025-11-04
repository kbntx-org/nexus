variable "name" {
  description = "Name of the firewall"
  type        = string
}

variable "ingress_rules" {
  description = "List of ingress firewall rules"
  type = list(object({
    protocol   = string
    port       = string
    source_ips = list(string)
  }))
  default = []
}

variable "egress_rules" {
  description = "List of egress firewall rules"
  type = list(object({
    protocol        = string
    port            = string
    destination_ips = list(string)
  }))
  default = []
}

variable "label_selector" {
  description = "Label selector query to attach this firewall to resources"
  type        = string
  default     = ""
}
