FROM hashicorp/vault:1.18.2
COPY config/config.hcl /vault/config/
COPY sql/vault.sql /docker-entrypoint-initdb.d/vault.sql
