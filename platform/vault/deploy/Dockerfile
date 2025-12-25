FROM hashicorp/vault:1.18.2 as dev
COPY config/development/config.hcl /vault/config/

FROM hashicorp/vault:1.18.2
COPY config/production/config.hcl /vault/config/
