resource "hcloud_firewall" "firewall" {
  name = var.name

  dynamic "rule" {
    for_each = var.ingress_rules
    content {
      direction  = "in"
      protocol   = rule.value.protocol
      port       = rule.value.port
      source_ips = rule.value.source_ips
    }
  }

  dynamic "rule" {
    for_each = var.egress_rules
    content {
      direction       = "out"
      protocol        = rule.value.protocol
      port            = rule.value.port
      destination_ips = rule.value.destination_ips
    }
  }
}

resource "hcloud_firewall_attachment" "attachment" {
  count = var.label_selector != "" ? 1 : 0

  firewall_id     = hcloud_firewall.firewall.id
  label_selectors = [var.label_selector]
}
