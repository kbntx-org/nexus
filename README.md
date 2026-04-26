# Nexus

My personal internal developer platform — a place to design and validate
platform engineering concepts by running real applications in a
production-like environment.

The platform itself is GitOps-driven (Terraform + ArgoCD), runs on a small
k3s cluster on Hetzner, and hosts the apps published under
[kbntx.com](https://kbntx.com).

## What's inside

- [apps/portfolio/](apps/portfolio/) — Angular personal portfolio, served at
  [kbntx.com](https://kbntx.com). Containerized and deployed via its own
  Helm chart.
- [docs/](docs/) — MkDocs Material site for the platform itself, served at
  [docs.kbntx.com](https://docs.kbntx.com).
- [platform/](platform/) — everything that makes the platform run:
  - **Infrastructure** — Terraform on Hetzner Cloud:
    [core/network/](platform/core/network/), [core/kubernetes/](platform/core/kubernetes/) (k3s),
    [services/bastion/](platform/services/bastion/), [core/vault/](platform/core/vault/), and the shared
    [modules/](platform/modules/).
  - **GitOps** — [core/argocd/](platform/core/argocd/) plus a
    [services/app-of-apps/](platform/services/app-of-apps/) chart that reconciles every other
    platform component.
  - **Ingress & access** — [core/traefik/](platform/core/traefik/) for cluster ingress,
    [core/cloudflared/](platform/core/cloudflared/) for Cloudflare Tunnel.
  - **Cluster components** — Hetzner Cloud Controller Manager + CSI,
    External Secrets Operator, k3s system upgrade controller, GitHub ARC
    runners, and a custom CI toolkit image
    ([services/custom-docker-images/](platform/services/custom-docker-images/)).
  - **Observability** — [services/monitoring/](platform/services/monitoring/): VictoriaMetrics,
    Grafana, Loki, Promtail, kube-state-metrics, node-exporter.
- [tools/](tools/) — bash helpers (KinD cluster bootstrap, SSH setup).
- [Tiltfile](Tiltfile) — local dev orchestration (Traefik + apps with live
  reload).

## Stack

- **Infrastructure**: Hetzner Cloud, k3s, Terraform
- **GitOps**: ArgoCD (app-of-apps), Helm
- **Ingress & access**: Traefik, Cloudflare Tunnel
- **Secrets**: External Secrets Operator, Vault
- **Observability**: VictoriaMetrics, Grafana, Loki
- **Apps**: Angular (portfolio), MkDocs Material (docs)
- **Tooling**: Nx, pnpm workspaces, Tilt, KinD

## Local development

You can spin up a local cluster and run the apps with live reload.

**Prerequisites**: Docker, [pnpm](https://pnpm.io/),
[kind](https://kind.sigs.k8s.io/),
[kubectl](https://kubernetes.io/docs/tasks/tools/),
[Tilt](https://tilt.dev/).

**Bootstrap a local cluster** — creates a KinD cluster with a local registry
and a port mapping that lets `*.localhost` routes hit Traefik directly. See
[tools/bash/cluster.sh](tools/bash/cluster.sh).

```sh
pnpm install
pnpm cluster:create
```

**Run an app** — Tilt deploys Traefik, metrics-server, and the selected
profile, with source hot-reload through Docker sync.

```sh
pnpm dev:portfolio   # → http://portfolio.localhost
pnpm dev:docs        # → http://docs.localhost
```

**Tear down**:

```sh
pnpm dev:reset       # tilt down — keeps the cluster
pnpm cluster:delete  # remove the KinD cluster + local registry
```

Available Tilt profiles (`docs`, `portfolio`, `all`) are defined in the
[Tiltfile](Tiltfile).

## Documentation

Deeper context on each platform component — design decisions, how it fits
together, and gotchas — lives at
[docs.kbntx.com](https://docs.kbntx.com).

## License

[MIT](LICENSE).
