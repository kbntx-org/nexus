resource "hcloud_network" "main_vpc" {
  name              = "main-vpc"
  ip_range          = "10.0.0.0/16"
  delete_protection = true
}

resource "hcloud_network_subnet" "main_subnet" {
  network_id   = hcloud_network.main_vpc.id
  type         = "cloud"
  network_zone = "eu-central"
  ip_range     = "10.0.0.0/24"
}

resource "hcloud_network_route" "default_via_nat_gateway" {
  network_id  = hcloud_network.main_vpc.id
  destination = "0.0.0.0/0"
  gateway     = "10.0.0.5"
}

