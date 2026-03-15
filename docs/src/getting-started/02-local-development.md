---
title: Local Development
---

## Prerequisites

Three tools are needed to run the local environment:

| Tool       | Purpose                                                           |
| ---------- | ----------------------------------------------------------------- |
| **Docker** | Container runtime — required by kind                              |
| **kind**   | Runs a Kubernetes cluster inside Docker                           |
| **Tilt**   | Orchestrates the local environment (builds, deploys, live reload) |

## Why Tilt?

The goal of the local environment is to replicate production conditions as closely as possible. Rather than running services with `docker compose` or plain `npm run dev`, everything runs inside a real Kubernetes cluster — the same way it runs in production.

Tilt was chosen because it lets you **fully codify** that environment:

- **Profiles** — start only what you need (docs, portfolio, or everything)
- **Hot reload** — file changes sync into the running container without a full rebuild
- **Registry and node pruning on `tilt down`** — Tilt cleans up the local image registry and the kind node storage when you stop, which prevents disk bloat over time
- **Reproducible** — the `Tiltfile` is the single definition of the local dev environment; anyone who clones the repo gets the same setup

This gets you to roughly **80% of production conditions**: same Kubernetes primitives (Deployments, Services, Ingress), same ingress controller (Traefik), same networking patterns — without the Cloudflare tunnel or external secrets.

## How Tilt Works

Tilt reads the [`Tiltfile`](https://github.com/kbntx-org/nexus/blob/main/Tiltfile) at the root of the repository. It defines:

- Which Docker images to build and where to push them (local registry at `localhost:5005`)
- Which Helm charts to install, with which values overrides
- Which files to watch for live sync into running containers
- Which resources belong to which profile

When you run `tilt up`, Tilt builds the images, deploys the Helm charts to the kind cluster, and starts watching for changes. Any file change matching a `sync` path is pushed directly into the running container — no rebuild needed.

## Getting Started

**1. Create the local cluster**

```bash
pnpm run cluster:create
```

This uses [ctlptl](https://github.com/tilt-dev/ctlptl) to create a kind cluster wired to a local image registry.

**2. Start the environment**

```bash
# Docs site only
pnpm run dev:docs

# Portfolio only
pnpm run dev:portfolio
```

Both commands call `tilt up` with the appropriate profile. Tilt opens a browser UI at `http://localhost:10350` where you can follow build and deploy progress.

**3. Tear down**

```bash
pnpm run dev:reset
```

Runs `tilt down`, which stops all resources and prunes the local registry and node storage.

**4. Delete the cluster entirely**

```bash
pnpm run cluster:delete
```

## References

- [`Tiltfile`](https://github.com/kbntx-org/nexus/blob/main/Tiltfile)
- [`package.json`](https://github.com/kbntx-org/nexus/blob/main/package.json) — `cluster:create`, `dev:docs`, `dev:portfolio`, `dev:reset`
- [Tilt documentation](https://docs.tilt.dev/)
