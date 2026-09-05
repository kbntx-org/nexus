---
title: Container registry
---

<a href="https://zotregistry.dev/" target="_blank" rel="noopener">zot</a> is the platform's
self-hosted OCI registry — a single static binary with no external database, exposing a browsable UI
and image search on top of the plain registry API. It runs as a
[core platform component](../cluster/01-overview.md#core-components), deployed the same way as every
other piece of cluster infrastructure (see [Overview](01-overview.md)).

## Why zot over an external registry

Docker Hub and GHCR both work fine for images this repo already pushes there, but a self-hosted
registry gives the platform a place to hold artifacts that shouldn't leave the cluster network (or
shouldn't depend on a third party's uptime): cached upstream images, internal build outputs, and
anything the GitOps loop needs to pull from a source it fully controls. zot was picked over heavier
options like <a href="https://goharbor.io/" target="_blank" rel="noopener">Harbor</a> because it
ships the same core needs — a UI, browsing, garbage collection, and optional auth — without a
multi-service Postgres + Redis + Trivy stack to operate.

## Configuration

The chart mounts a single `config.json` (see zot's
<a href="https://zotregistry.dev/latest/admin-guide/admin-configuration/" target="_blank" rel="noopener">configuration
reference</a>) rather than exposing every option as a Helm value — that file is the source of truth
for storage and the extensions below.

- **No auth** — `http` carries no `auth`/`accessControl` block, so the registry is anonymous
  read/write; access is gated at the network layer (ingress + cluster network policy) instead of
  per-user credentials. zot supports htpasswd/OIDC/LDAP auth if that ever needs to change — see the
  <a href="https://zotregistry.dev/latest/articles/authn-authz/" target="_blank" rel="noopener">authn/authz
  guide</a>.
- **Garbage collection** — `storage.gc` reclaims blobs orphaned by manifest deletion on a schedule
  (`gcInterval`), with `gcDelay` giving in-flight pulls time to finish before a blob is swept.
- **UI and search** — the `extensions.ui` and `extensions.search` blocks turn on the registry's
  browsable web UI, which depends on the search extension being enabled to index repositories.
- **Storage** — `storage.storageDriver` points zot at an R2 bucket, the same object storage used for
  database backups (see [Databases](../databases/01-overview.md)), instead of a
  `PersistentVolumeClaim`, so the pod holds no image data itself. The chart still mounts an
  `emptyDir` at `storage.rootDirectory` for zot's local blob-metadata cache, which is safe to lose
  on a restart — the registry content itself lives entirely in the bucket. Credentials for that
  bucket come in as `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` env vars from a Vault-backed secret
  (see [Secrets management](../secrets/01-overview.md)) rather than living in `config.json` itself.
- **Pull-through cache** — `extensions.sync` mirrors Docker Hub and GHCR on demand: the first pull
  of an upstream image through zot fetches and caches it, every pull after that is served locally.
  Each upstream is routed to its own path (`/dockerhub`, `/ghcr`) via `content[].destination`, so
  `registry.kbntx.com/dockerhub/<image>` and `registry.kbntx.com/ghcr/<image>` behave like local
  mirrors of their upstream. See zot's
  <a href="https://zotregistry.dev/latest/articles/mirroring/" target="_blank" rel="noopener">mirroring
  guide</a> for the full `sync` schema (scheduled sync, tag filters, credentials for private
  upstreams).

## Provisioning the R2 bucket

Unlike every other chart's `templates/secrets.yaml`, which only reads Vault, zot also needs a
Cloudflare R2 bucket and a bucket-scoped S3 credential to exist before it can start. That's a
`terraform apply` outside the GitOps loop, not something ArgoCD can create — so the component splits
into a `provision/` Terraform project (the bucket and API token) and a `deploy/` Helm chart (what
ArgoCD actually syncs), the same split used for
[Vault's Kubernetes auth backend](../secrets/01-overview.md). `terraform output` after applying
`provision/` gives the values to seed into the `zot` Vault kv entry that
`deploy/templates/secrets.yaml`'s `ExternalSecret` reads.

## References

- <a href="https://github.com/kbntx-org/nexus/tree/main/platform/core/zot/deploy" target="_blank" rel="noopener"><code>platform/core/zot/deploy/</code></a>
  — the umbrella chart, Vault-backed secrets, and ingress
- <a href="https://github.com/kbntx-org/nexus/blob/main/platform/core/zot/deploy/values.yaml" target="_blank" rel="noopener"><code>platform/core/zot/deploy/values.yaml</code></a>
  — `config.json`, storage backend, sync, and ingress host
- <a href="https://github.com/kbntx-org/nexus/tree/main/platform/core/zot/provision" target="_blank" rel="noopener"><code>platform/core/zot/provision/</code></a>
  — Terraform for the R2 bucket and its scoped API token
- [Overview](01-overview.md) — the app-of-apps pattern this component is registered under
- [Secrets management](../secrets/01-overview.md) — the Vault + External Secrets pattern reused here
