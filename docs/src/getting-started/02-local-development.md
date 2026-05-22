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

Three tools are needed to run the local environment:

| Tool   | Why                                          | Install                                                                                                          |
| ------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Docker | Container runtime — required by kind         | [Install guide](https://docs.docker.com/engine/install/){ target="\_blank" rel="noopener" }                      |
| kind   | Runs Kubernetes inside Docker                | [Install guide](https://kind.sigs.k8s.io/docs/user/quick-start/#installation){ target="\_blank" rel="noopener" } |
| Tilt   | Builds, deploys, and live-reloads everything | [Install guide](https://docs.tilt.dev/install.html){ target="\_blank" rel="noopener" }                           |

## Why Tilt?

Tilt was chosen because it codifies the entire local dev environment in a
single [`Tiltfile`](https://github.com/kbntx-org/nexus/blob/main/Tiltfile){ target="\_blank" rel="noopener" }:

- **A real programming language** — the `Tiltfile` is written in Starlark
  (a Python dialect), not YAML. That means loops, conditionals, helpers,
  and reading files at runtime — things that get awkward fast with raw
  Kubernetes manifests or Helm templating. Profiles, env-var injection,
  and per-app live-update rules all live in shared functions instead of
  being copy-pasted across files.
- **Profiles** — start only what you need (`docs`, `portfolio`, or `all`).
- **Hot reload** — file changes sync into the running container, no
  rebuild.
- **Reproducible** — anyone who clones the repo gets the same setup.
- **Self-cleaning** — `tilt down` prunes the local image registry and the
  kind node storage, which keeps disk usage in check over time.

This enables every platform component to be tested locally before it
ever reaches production.

## How Tilt works

Tilt reads the [`Tiltfile`](https://github.com/kbntx-org/nexus/blob/main/Tiltfile){ target="\_blank" rel="noopener" }
at the root of the repository. It defines:

- Which Docker images to build and where to push them (local registry
  exposed by the kind cluster)
- Which Helm charts to install, with which values overrides
- Which files to watch for live sync into running containers
- Which resources belong to which profile

When you run `tilt up`, Tilt builds the images, deploys the Helm charts
to the kind cluster, and starts watching for changes. Any file change
matching a `sync` path is pushed directly into the running container —
no rebuild needed.

## Getting started

**1. Create the local cluster**

```bash
pnpm run cluster:create
```

This runs [`tools/bash/cluster.sh`](https://github.com/kbntx-org/nexus/blob/main/tools/bash/cluster.sh){ target="\_blank" rel="noopener" },
which uses `kind` directly to create the cluster, starts a local Docker
image registry alongside it, and wires the cluster's containerd to use it
as a mirror. The host port mapping in the same script is what lets
`*.localhost` URLs reach Traefik without `kubectl port-forward`.

**2. Start the environment**

Pick which profile(s) to bring up — `docs`, `portfolio`, or `all`:

```bash
tilt up -- --profile docs
tilt up -- --profile portfolio
tilt up -- --profile all
```

The flag can be passed multiple times (`--profile docs --profile portfolio`)
to start more than one app. If you don't want to type the flag every time,
set `TILT_PROFILES` in a local `.env` file at the repo root:

```bash
# .env
TILT_PROFILES=docs,portfolio
```

`tilt up` will pick it up automatically. Tilt opens a browser UI where
you can follow build and deploy progress.

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

- [`Tiltfile`](https://github.com/kbntx-org/nexus/blob/main/Tiltfile){ target="\_blank" rel="noopener" } — local dev orchestration
- [`package.json`](https://github.com/kbntx-org/nexus/blob/main/package.json){ target="\_blank" rel="noopener" } — `cluster:create`, `dev:docs`, `dev:portfolio`, `dev:reset`, `cluster:delete`
- [`tools/bash/`](https://github.com/kbntx-org/nexus/tree/main/tools/bash){ target="\_blank" rel="noopener" } — cluster bootstrap helpers
