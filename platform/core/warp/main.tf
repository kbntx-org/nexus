locals {
  # Default Local Domain Fallback entries recommended by Cloudflare
  default_local_domains = [
    { suffix = "corp" },
    { suffix = "domain" },
    { suffix = "home" },
    { suffix = "home.arpa" },
    { suffix = "host" },
    { suffix = "internal" },
    { suffix = "intranet" },
    { suffix = "invalid" },
    { suffix = "lan" },
    { suffix = "local" },
    { suffix = "localdomain" },
    { suffix = "localhost" },
    { suffix = "private" },
    { suffix = "test" },
  ]

  # Default Split Tunnel exclude entries recommended by Cloudflare
  default_split_tunnel_exclude = [
    { address = "ff05::/16" },
    { address = "ff04::/16" },
    { address = "ff03::/16" },
    { address = "ff02::/16" },
    { address = "ff01::/16" },
    { address = "fe80::/10", description = "IPv6 Link Local" },
    { address = "fd00::/8" },
    { address = "255.255.255.255/32", description = "DHCP Broadcast" },
    { address = "240.0.0.0/4" },
    { address = "224.0.0.0/24" },
    { address = "192.168.0.0/16" },
    { address = "192.0.0.0/24" },
    { address = "172.16.0.0/12" },
    { address = "169.254.0.0/16", description = "DHCP Unspecified" },
    { address = "100.96.0.0/11" },
    { address = "100.88.0.0/13" },
    { address = "100.82.0.0/15" },
    { address = "100.81.0.0/16" },
    { address = "100.64.0.0/12" },
    { address = "10.8.0.0/13" },
    { address = "10.64.0.0/10" },
    { address = "10.4.0.0/14" },
    { address = "10.2.0.0/15" },
    { address = "10.16.0.0/12" },
    { address = "10.128.0.0/9" },
    { address = "10.1.0.0/16" },
  ]
}

resource "cloudflare_zero_trust_device_default_profile" "default_profile" {
  account_id          = var.cloudflare_account_id
  dns_search_suffixes = []

  exclude = local.default_split_tunnel_exclude

  lifecycle {
    ignore_changes = [policy_id]
  }
}

resource "cloudflare_zero_trust_device_default_profile_local_domain_fallback" "default_profile" {
  account_id = var.cloudflare_account_id

  domains = concat(
    local.default_local_domains,
    [
      {
        suffix      = "svc.cluster.local"
        description = "Access kubernetes services directly"
        dns_server  = ["10.43.0.10"]
      },
      {
        suffix      = "internal.kbntx.com"
        description = "Access kubernetes services directly with easy name"
        dns_server  = ["10.43.0.10"]
      }
    ]
  )
}
