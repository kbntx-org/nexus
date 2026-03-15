# CLAUDE.md — cloudflare-ingress-controller

Inherits all rules from the [root CLAUDE.md](../../CLAUDE.md).

---

## Package layout

```
cmd/main.go                        — binary entry point, wiring only
internal/cloudflare/cloudflare.go  — Cloudflare Tunnel API client
internal/k8s/k8s.go               — Kubernetes Ingress lister/watcher
internal/controller/controller.go  — reconciliation logic (pure, no I/O deps)
```

## Naming reminders specific to this project

- Never use `cf` as a prefix for Cloudflare identifiers — write `cloudflare` in full.
- The `k8s` import alias (`k8ssvc`) is acceptable **only** for the import alias
  itself; local variables must use the full name (`kubernetesService`).

## Constants over literals

All domain-specific string and duration literals must be named constants:

| Constant | Value | Location |
|---|---|---|
| `catchAllRule` | `"http_status:404"` | `internal/cloudflare/cloudflare.go` |
| `watchReconnectDelay` | `5 * time.Second` | `internal/k8s/k8s.go` |
