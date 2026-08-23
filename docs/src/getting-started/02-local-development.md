---
title: Local Development
---

The local environment runs everything inside a real Kubernetes cluster (via
<a href="https://kind.sigs.k8s.io/" target="_blank" rel="noopener">kind</a>) and uses
<a href="https://tilt.dev/" target="_blank" rel="noopener">Tilt</a> to orchestrate it. The goal is
to develop against the **same primitives, same ingress controller, and same Helm charts** as
production, not a parallel `docker compose` setup that drifts from the real thing. The idea is that
before deploying it to the cluster, an idea can be tested locally.

## Prerequisites

These tools are needed to run the local environment:

| Tool    | Why                                                                 | Install                                                                                                                 |
| ------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Node.js | Runtime for the Nx workspace and pnpm itself                        | <a href="https://nodejs.org/en/download" target="_blank" rel="noopener">Install guide</a>                               |
| pnpm    | Package manager for the workspace, and the `pnpm run` scripts below | <a href="https://pnpm.io/installation" target="_blank" rel="noopener">Install guide</a>                                 |
| Docker  | Container runtime — required by kind                                | <a href="https://docs.docker.com/engine/install/" target="_blank" rel="noopener">Install guide</a>                      |
| kind    | Runs Kubernetes inside Docker                                       | <a href="https://kind.sigs.k8s.io/docs/user/quick-start/#installation" target="_blank" rel="noopener">Install guide</a> |
| Tilt    | Builds, deploys, and live-reloads everything                        | <a href="https://docs.tilt.dev/install.html" target="_blank" rel="noopener">Install guide</a>                           |
| mkcert  | Issues the locally-trusted TLS certificate for `*.localhost`        | <a href="https://github.com/FiloSottile/mkcert#installation" target="_blank" rel="noopener">Install guide</a>           |

## Why Tilt?

Tilt was chosen because it codifies the entire local dev environment in Starlark, split across the
root
<a href="https://github.com/kbntx-org/nexus/blob/main/Tiltfile" target="_blank" rel="noopener"><code>Tiltfile</code></a>
and the reusable building blocks under
<a href="https://github.com/kbntx-org/nexus/tree/main/platform/core/local" target="_blank" rel="noopener"><code>platform/core/local/</code></a>:

- **A real programming language** — Tiltfiles are written in Starlark (a Python dialect), not YAML.
  That means loops, conditionals, helpers, and reading files at runtime — things that get awkward
  fast with raw Kubernetes manifests or Helm templating. Chart dependency building and per-app
  live-update rules all live in shared functions instead of being copy-pasted across files.
- **Selective resources** — core infra (Vault, Traefik, metrics-server, CloudNative-PG, External
  Secrets) always runs; `docs`, `portfolio`, and `monitoring` are opt-in, started by name or toggled
  from the Tilt UI.
- **Hot reload** — file changes sync into the running container, no rebuild.
- **Reproducible** — anyone who clones the repo gets the same setup.
- **Self-cleaning** — `tilt down` prunes the local image registry and the kind node storage, which
  keeps disk usage in check over time.

This enables every platform component to be tested locally before it ever reaches production.

## How Tilt works

Tilt reads the
<a href="https://github.com/kbntx-org/nexus/blob/main/Tiltfile" target="_blank" rel="noopener"><code>Tiltfile</code></a>
at the root of the repository, which is a thin entrypoint: it enables core infra by default, enables
any resources named on the command line on top of that, and loads three files from
<a href="https://github.com/kbntx-org/nexus/tree/main/platform/core/local" target="_blank" rel="noopener"><code>platform/core/local/</code></a>:

- `lib.tilt` — shared Starlark helper functions (chart dependency building, cluster context
  bootstrap)
- `platform.tilt` — core infra: registry, Vault, External Secrets, Traefik, metrics-server,
  CloudNative-PG, monitoring
- `apps.tilt` — product resources: which Docker images to build, which Helm charts to install, and
  which files to watch for live sync into running containers

When you run `tilt up`, Tilt builds the images, deploys the Helm charts to the kind cluster, and
starts watching for changes. Any file change matching a `sync` path is pushed directly into the
running container — no rebuild needed.

## Getting started

**1. Create the local cluster**

```bash
pnpm run cluster:create
```

This runs
<a href="https://github.com/kbntx-org/nexus/blob/main/platform/core/local/cluster.sh" target="_blank" rel="noopener"><code>platform/core/local/cluster.sh</code></a>,
which uses `kind` directly to create the cluster, starts a local Docker image registry alongside it,
and wires the cluster's containerd to use it as a mirror. The host port mapping in the same script
is what lets `*.localhost` URLs reach Traefik without `kubectl port-forward`. It also issues a
locally-trusted TLS certificate with `mkcert` so those URLs work over `https://` too. The script
also supports `recreate`, which tears down and re-creates the cluster in one step
(`pnpm run cluster:recreate`).

**2. Start the environment**

`tilt up` alone brings up only core infra (Vault, Traefik, metrics-server, External Secrets,
CloudNative-PG). Name the resource(s) you want on top of that:

```bash
tilt up -- docs
tilt up -- portfolio
tilt up -- docs portfolio
```

You can also start with just `tilt up` and enable `docs`, `portfolio`, or `monitoring` later from
the Tilt web UI without restarting. Tilt opens a browser UI where you can follow build and deploy
progress either way.

**3. Tear down**

```bash
tilt down
```

This will stop all resources managed by tilt.

**4. Delete the cluster entirely**

```bash
pnpm run cluster:delete
```

## References

- <a href="https://github.com/kbntx-org/nexus/blob/main/Tiltfile" target="_blank" rel="noopener"><code>Tiltfile</code></a>
  — local dev entrypoint (resource enablement)
- <a href="https://github.com/kbntx-org/nexus/tree/main/platform/core/local" target="_blank" rel="noopener"><code>platform/core/local/</code></a>
  — `lib.tilt`, `platform.tilt`, `apps.tilt`, and the cluster bootstrap script
- <a href="https://github.com/kbntx-org/nexus/blob/main/package.json" target="_blank" rel="noopener"><code>package.json</code></a>
  — `cluster:create`, `cluster:recreate`, `cluster:delete`, `dev:docs`, `dev:portfolio`
