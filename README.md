# Nexus

My personal internal developer platform to deploy apps in production and experiment with modern
tooling and technologies.

The platform itself is GitOps-driven (Terraform + ArgoCD), runs on a small k3s cluster on Hetzner,
and hosts the apps published under [kbntx.com](https://kbntx.com).

## What's inside

- [apps/](apps/) — the applications the platform hosts (currently the Angular portfolio).
- [docs/](docs/) — the MkDocs Material site this README points to below.
- [platform/](platform/) — everything that makes the platform run: Terraform-provisioned
  infrastructure, the GitOps/CI-CD pipeline, ingress and access, secrets, databases, and
  observability. See [docs.kbntx.com](https://docs.kbntx.com) for what's actually in there.

## Stack

- **Apps**: Angular, TypeScript, Go, Nx monorepo
- **Infrastructure**: Hetzner Cloud, k3s, Terraform
- **GitOps & CI/CD**: ArgoCD (app-of-apps), GitHub Actions on self-hosted runners
- **Ingress & access**: Traefik, Cloudflare Tunnel, cert-manager
- **Secrets**: Vault, External Secrets Operator
- **Databases**: CloudNativePG
- **Observability**: VictoriaMetrics, Grafana, Loki
- **Local dev**: pnpm workspaces, Tilt, kind

## Local development

You can spin up a local cluster and run the apps with live reload.

**Prerequisites**: Docker. Everything else (Node.js, pnpm, kind, kubectl, Tilt, mkcert, Helm,
Terraform, ...) is pinned in [mise.toml](mise.toml) and installed by the bootstrap script below.

**Bootstrap** — `create` installs [mise](https://mise.jdx.dev/) if it isn't already there, installs
every tool pinned in `mise.toml`, then creates a KinD cluster with a local registry and a port
mapping that lets `*.localhost` routes hit Traefik directly. See
[platform/core/local/local.sh](platform/core/local/local.sh). Safe to re-run any time — every step
is idempotent.

```sh
platform/core/local/local.sh create
```

**Run an app** — Tilt deploys core infra (Traefik, metrics-server, etc.) plus the app(s) named on
the command line, with source hot-reload through Docker sync.

```sh
mise run dev:portfolio   # → http://portfolio.localhost
mise run dev:docs        # → http://docs.localhost
```

**Tear down**:

```sh
tilt down                    # keeps the cluster
mise run cluster:delete      # remove the KinD cluster + local registry
```

See the [Tiltfile](Tiltfile) and [platform/core/local/](platform/core/local/) for the full set of
resources and how enablement works.

## Documentation

Deeper context on each platform component — design decisions, how it fits together, and gotchas —
lives at [docs.kbntx.com](https://docs.kbntx.com).

## License

[MIT](LICENSE).
