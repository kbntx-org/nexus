output "firewall_id" {
  description = "ID of the created firewall"
  value       = hcloud_firewall.firewall.id
}

output "firewall_name" {
  description = "Name of the created firewall"
  value       = hcloud_firewall.firewall.name
}

output "attachment_id" {
  description = "ID of the firewall attachment"
  value       = length(hcloud_firewall_attachment.attachment) > 0 ? hcloud_firewall_attachment.attachment[0].id : null
}
