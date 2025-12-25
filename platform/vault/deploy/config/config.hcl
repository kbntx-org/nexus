ui = true

storage "postgres" {
  connection_url = "${VAULT_POSTGRES_CONNECTION_URI}"
}

listener "tcp" {
  address = "0.0.0.0:8200",
  tls_disable = true

  telemetry {
    unauthenticated_metrics_access = true
  }
}

telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = true
}

log_level = "info"
log_file = "/vault/logs/server.log"
log_format = "json"
log_rotate_bytes = 10000000
