output "server_id" {
  description = "ID of the provisioned server"
  value       = hcloud_server.this.id
}
