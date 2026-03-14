# Platform

The platform layer is everything that makes applications run reliably: infrastructure, networking, secrets, observability, and CI/CD.

## Component map

```mermaid
graph TB
    subgraph Provisioning["Provisioning (Terraform)"]
        TF_NET[Network / VPC]
        TF_K3S[K3S Cluster]
        TF_BAS[Bastion Host]
        TF_VLT[Vault Host]
    end

    subgraph K3S["K3S Cluster (ArgoCD managed)"]
        subgraph Networking
            Traefik
            Cloudflared
            CIC[Cloudflare Ingress Controller]
        end
        subgraph Security
            ESO[External Secrets Operator]
        end
        subgraph Observability
            Grafana
            Loki
            Promtail
            VM[VictoriaMetrics]
        end
        subgraph CICD["CI/CD"]
            ARC[ARC Controller]
            Runners[ARC Runners]
        end
        subgraph Apps["Applications"]
            Portfolio
            Docs[Documentation]
            Homepage
        end
        ArgoCD
    end

    subgraph External["External Services"]
        GitHub
        CF[Cloudflare]
        DHR[Docker Hub]
        Vault
    end

    TF_NET --> TF_K3S
    TF_K3S --> K3S
    GitHub --> ArgoCD
    ArgoCD --> Networking
    ArgoCD --> Security
    ArgoCD --> Observability
    ArgoCD --> CICD
    ArgoCD --> Apps
    ESO --> Vault
    CIC --> CF
    Cloudflared --> CF
    Runners --> DHR
```

## Sections

| Section                                   | What it covers                                             |
| ----------------------------------------- | ---------------------------------------------------------- |
| [Infrastructure](infrastructure/index.md) | Hetzner Cloud, Terraform, K3S cluster, networking, bastion |
| [GitOps](gitops/index.md)                 | ArgoCD, App-of-Apps pattern, sync strategy                 |
| [Networking](networking/index.md)         | Traefik, Cloudflare Tunnel, custom Ingress Controller      |
| [Security](security/index.md)             | HashiCorp Vault, External Secrets Operator                 |
| [Observability](observability/index.md)   | Grafana, Loki, Promtail, VictoriaMetrics, Node Exporter    |
| [CI/CD](ci-cd/index.md)                   | GitHub Actions, self-hosted ARC runners, CI toolkit        |
| [Applications](applications/index.md)     | Portfolio, Documentation site, Homepage                    |
