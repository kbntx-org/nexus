---
title: Local Development
---

The local environment runs everything inside a real Kubernetes cluster
(via [kind](https://kind.sigs.k8s.io/){ target="\_blank" rel="noopener" })
and uses [Tilt](https://tilt.dev/){ target="\_blank" rel="noopener" } to
orchestrate it. The goal is to develop against the **same primitives,
same ingress controller, and same Helm charts** as production — not a
parallel `docker compose` setup that drifts from the real thing.

## Prerequisites

Four tools are needed to run the local environment:

| Tool   | Why                                                          | Install                                                                                                          |
| ------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Docker | Container runtime — required by kind                         | [Install guide](https://docs.docker.com/engine/install/){ target="\_blank" rel="noopener" }                      |
| kind   | Runs Kubernetes inside Docker                                | [Install guide](https://kind.sigs.k8s.io/docs/user/quick-start/#installation){ target="\_blank" rel="noopener" } |
| Tilt   | Builds, deploys, and live-reloads everything                 | [Install guide](https://docs.tilt.dev/install.html){ target="\_blank" rel="noopener" }                           |
| mkcert | Issues the locally-trusted TLS certificate for `*.localhost` | [Install guide](https://github.com/FiloSottile/mkcert#installation){ target="\_blank" rel="noopener" }           |

## Why Tilt?

Tilt was chosen because it codifies the entire local dev environment in
Starlark, split across the root
[`Tiltfile`](https://github.com/kbntx-org/nexus/blob/main/Tiltfile){ target="\_blank" rel="noopener" }
and the reusable building blocks under
[`platform/core/local/`](https://github.com/kbntx-org/nexus/tree/main/platform/core/local){ target="\_blank" rel="noopener" }:

- **A real programming language** — Tiltfiles are written in Starlark
  (a Python dialect), not YAML. That means loops, conditionals, helpers,
  and reading files at runtime — things that get awkward fast with raw
  Kubernetes manifests or Helm templating. Chart dependency building and
  per-app live-update rules all live in shared functions instead of being
  copy-pasted across files.
- **Selective resources** — core infra (Vault, Traefik, metrics-server,
  CloudNative-PG, External Secrets) always runs; `docs`, `portfolio`, and
  `monitoring` are opt-in, started by name or toggled from the Tilt UI.
- **Hot reload** — file changes sync into the running container, no
  rebuild.
- **Reproducible** — anyone who clones the repo gets the same setup.
- **Self-cleaning** — `tilt down` prunes the local image registry and the
  kind node storage, which keeps disk usage in check over time.

This enables every platform component to be tested locally before it
ever reaches production.

## How Tilt works

Tilt reads the [`Tiltfile`](https://github.com/kbntx-org/nexus/blob/main/Tiltfile){ target="\_blank" rel="noopener" }
at the root of the repository, which is a thin entrypoint: it enables core
infra by default, enables any resources named on the command line on top of
that, and loads three files from
[`platform/core/local/`](https://github.com/kbntx-org/nexus/tree/main/platform/core/local){ target="\_blank" rel="noopener" }:

- `lib.tilt` — shared Starlark helper functions (chart dependency building,
  cluster context bootstrap)
- `platform.tilt` — core infra: registry, Vault, External Secrets, Traefik,
  metrics-server, CloudNative-PG, monitoring
- `apps.tilt` — product resources: which Docker images to build, which Helm
  charts to install, and which files to watch for live sync into running
  containers

When you run `tilt up`, Tilt builds the images, deploys the Helm charts
to the kind cluster, and starts watching for changes. Any file change
matching a `sync` path is pushed directly into the running container —
no rebuild needed.

## Getting started

**1. Create the local cluster**

```bash
pnpm run cluster:create
```

This runs [`platform/core/local/cluster.sh`](https://github.com/kbntx-org/nexus/blob/main/platform/core/local/cluster.sh){ target="\_blank" rel="noopener" },
which uses `kind` directly to create the cluster, starts a local Docker
image registry alongside it, and wires the cluster's containerd to use it
as a mirror. The host port mapping in the same script is what lets
`*.localhost` URLs reach Traefik without `kubectl port-forward`. It also
issues a locally-trusted TLS certificate with `mkcert` so those URLs work
over `https://` too — see [Local TLS](../platform/traefik/01-overview.md#local-tls)
in the Traefik doc for how that's wired up. The script also supports
`recreate`, which tears down and re-creates the cluster in one step
(`pnpm run cluster:recreate`).

**2. Start the environment**

`tilt up` alone brings up only core infra (Vault, Traefik, metrics-server,
External Secrets, CloudNative-PG). Name the resource(s) you want on top of
that:

```bash
tilt up -- docs
tilt up -- portfolio
tilt up -- docs portfolio
```

You can also start with just `tilt up` and enable `docs`, `portfolio`, or
`monitoring` later from the Tilt web UI without restarting. Tilt opens a
browser UI where you can follow build and deploy progress either way.

**3. Tear down**

```bash
pnpm run dev:reset
```

Runs `tilt down`, which stops all resources and prunes the local registry
and node storage.

**4. Delete the cluster entirely**

```bash
pnpm run cluster:delete
```

## References

- [`Tiltfile`](https://github.com/kbntx-org/nexus/blob/main/Tiltfile){ target="\_blank" rel="noopener" } — local dev entrypoint (resource enablement)
- [`platform/core/local/`](https://github.com/kbntx-org/nexus/tree/main/platform/core/local){ target="\_blank" rel="noopener" } — `lib.tilt`, `platform.tilt`, `apps.tilt`, and the cluster bootstrap script
- [`package.json`](https://github.com/kbntx-org/nexus/blob/main/package.json){ target="\_blank" rel="noopener" } — `cluster:create`, `cluster:recreate`, `cluster:delete`, `dev:docs`, `dev:portfolio`, `dev:reset`
