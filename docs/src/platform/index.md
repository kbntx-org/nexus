# Platform overview

Nexus is organized around a GitOps-managed Kubernetes platform.

## Control plane model

```mermaid
flowchart TD
    Git[(nexus repo)] --> CI[GitHub Actions]
    Git --> AOA[ArgoCD app-of-apps values]
    AOA --> ARGO[ArgoCD Applications]
    ARGO --> NS1[Platform namespaces]
    ARGO --> NS2[Application namespaces]
    CI --> IMG[(Container registry)]
    IMG --> ARGO
```

## Deployed component groups

- **Ingress & traffic**: Traefik, cloudflared, cloudflare ingress controller.
- **Secrets & security**: External Secrets, Vault-related manifests.
- **Observability**: Monitoring stack (Grafana/Prometheus).
- **Cluster operations**: k3s upgrade controller and plans.
- **Applications**: Portfolio, Homepage, Documentation, Appsmith.

See detailed pages in this section for operational boundaries.
