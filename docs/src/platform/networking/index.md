# Networking

Nexus uses a layered networking model. Traffic from the internet reaches the cluster through Cloudflare, is tunnelled into the cluster via a **Cloudflare Tunnel**, and is then routed to services by **Traefik**.

## Traffic flow

```mermaid
flowchart LR
    Browser --> CF["Cloudflare\n(DNS + DDoS)"]
    CF -->|"Cloudflare Tunnel\n(outbound only)"| CFD["cloudflared\ndaemon"]

    subgraph K3S Cluster
        CFD --> Traefik
        CIC["Cloudflare\nIngress Controller"] -->|"watches Ingress\nresources"| Traefik
        CIC -->|"syncs hostnames\nto tunnel config"| CF
        Traefik --> SVC1[Service A]
        Traefik --> SVC2[Service B]
        Traefik --> SVC3[Service N]
    end
```

No inbound firewall ports need to be opened. The tunnel is fully outbound, which means the cluster is never directly reachable from the internet.

## Components

| Component                                                         | Path                                      | Role                                         |
| ----------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------- |
| [Traefik](traefik.md)                                             | `platform/traefik/`                       | In-cluster ingress controller                |
| [cloudflared](cloudflared.md)                                     | `platform/cloudflared/`                   | Cloudflare Tunnel daemon                     |
| [Cloudflare Ingress Controller](cloudflare-ingress-controller.md) | `platform/cloudflare-ingress-controller/` | Syncs K8s Ingress → Cloudflare tunnel config |
