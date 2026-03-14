# Nexus documentation

This documentation is the practical guide to working in the Nexus repository.

It is intentionally opinionated and focused on **how we use tools in this repo**, not a copy of official documentation.

## Start here

- New to the repo? Read [Onboarding](onboarding/index.md).
- Need architecture context? Read [Platform overview](platform/index.md).
- Looking for day-2 commands? Go to [Runbooks](runbooks/common-tasks.md).

## What Nexus contains

```mermaid
flowchart LR
    Dev[Developer] --> GH[GitHub PR + CI]
    GH --> ARGO[ArgoCD app-of-apps]
    ARGO --> K3S[K3s cluster]
    K3S --> APPS[Applications\nPortfolio / Homepage / Docs]
    K3S --> PLATFORM[Platform components\nIngress / Secrets / Monitoring]
    PLATFORM --> OBS[Grafana + Prometheus]
```
