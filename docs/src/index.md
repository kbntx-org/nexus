# Nexus Platform

Nexus is a personal **platform engineering hub** — a production-grade monorepo that covers the full lifecycle of a cloud-native platform: infrastructure provisioning, GitOps deployment, secrets management, observability, networking, CI/CD, and application delivery.

It started as a homelab project and grew into a showcase of how platform engineering principles can be applied end-to-end, from a bare Hetzner VPS to running workloads accessible at public URLs.

## Architecture at a glance

```mermaid
graph TB
    subgraph Internet
        User([User / Browser])
        CF[Cloudflare]
    end

    subgraph Hetzner Cloud
        subgraph K3S Cluster
            Traefik[Traefik<br/>Ingress]
            ArgoCD[ArgoCD<br/>GitOps]
            CIC[Cloudflare Ingress<br/>Controller]
            ESO[External Secrets<br/>Operator]
            Monitoring[Monitoring Stack<br/>Grafana · Loki · VictoriaMetrics]
            Runners[GitHub Actions<br/>Runners]
            Apps[Applications<br/>Portfolio · Docs · Homepage]
        end
        Bastion[Bastion Host]
    end

    subgraph External Services
        GitHub[GitHub<br/>kbntx-org/nexus]
        Vault[HashiCorp Vault<br/>Secrets]
        DockerHub[Docker Hub<br/>Image Registry]
    end

    User -->|HTTPS| CF
    CF -->|Cloudflare Tunnel| CIC
    CIC -->|reconciles| Traefik
    Traefik --> Apps
    ArgoCD -->|syncs from| GitHub
    ESO -->|pulls secrets| Vault
    Runners -->|push images| DockerHub
    Runners -->|trigger sync| ArgoCD
    GitHub -->|triggers workflows| Runners
```

## What's inside

| Area | Components |
|------|-----------|
| **Infrastructure** | K3S on Hetzner Cloud, Terraform modules, VPC, Bastion |
| **GitOps** | ArgoCD, App-of-Apps pattern |
| **Networking** | Traefik, Cloudflared, custom Cloudflare Ingress Controller |
| **Security** | HashiCorp Vault, External Secrets Operator |
| **Observability** | Grafana, Loki, Promtail, VictoriaMetrics, Node Exporter |
| **CI/CD** | GitHub Actions, self-hosted ARC runners, custom CI toolkit |
| **Applications** | Portfolio (Angular), Documentation (MkDocs), Homepage |

## Where to start

New to the platform? Head to **[Onboarding →](onboarding/index.md)** for prerequisites and a guided tour.

Familiar with the basics? Jump into the **[Platform →](platform/index.md)** section to explore individual components.
