# Security

Secrets management in Nexus follows a strict principle: **no secrets in Git, ever**. Secrets live in HashiCorp Vault and are synchronised into Kubernetes at runtime by the External Secrets Operator.

## Secret lifecycle

```mermaid
flowchart LR
    subgraph "Outside cluster"
        Dev["Operator / CI"] -->|"vault kv put"| Vault
    end

    subgraph "K3S Cluster"
        ESO["External Secrets\nOperator"] -->|"reads SecretStore\n+ ExternalSecret CRDs"| ESO
        ESO -->|"fetch secret"| Vault
        ESO -->|"create/update\nK8s Secret"| KSec["Kubernetes Secret"]
        App["Application Pod"] -->|"mount / env"| KSec
    end
```

No application ever talks to Vault directly. The External Secrets Operator is the only component with Vault credentials.

## Components

| Component                                        | Path                         | Role                            |
| ------------------------------------------------ | ---------------------------- | ------------------------------- |
| [HashiCorp Vault](vault.md)                      | `platform/vault/`            | Source of truth for all secrets |
| [External Secrets Operator](external-secrets.md) | `platform/external-secrets/` | Syncs Vault secrets into K8s    |
