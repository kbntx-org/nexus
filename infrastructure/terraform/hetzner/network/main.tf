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

