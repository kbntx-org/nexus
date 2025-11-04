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

variable "default_user" {
  description = "Default SSH key to use for the servers"
  type = object({
    name       = string
    ssh_key    = string
    ssh_key_id = string
  })
}

variable "additional_users" {
  description = "Additional users to create on the server"
  type = map(object({
    name    = string
    ssh_key = string
    groups  = list(string)
  }))
  default = {}
}
