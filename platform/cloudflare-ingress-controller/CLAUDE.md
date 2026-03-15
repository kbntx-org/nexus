# CLAUDE.md — cloudflare-ingress-controller

Inherits all rules from the [root CLAUDE.md](../../CLAUDE.md).

---

## Package layout

```
cmd/main.go                        — binary entry point, wiring only
internal/cloudflare/cloudflare.go  — Cloudflare SDK client (tunnel lifecycle + ingress config)
internal/k8s/k8s.go               — Kubernetes Ingress lister/watcher + Secret/Deployment/PDB management
internal/controller/controller.go  — reconciliation logic (pure, no I/O deps)
```

## Naming reminders specific to this project

- Never use `cf` as a prefix for Cloudflare identifiers — write `cloudflare` in full.
- The `k8s` import alias (`k8ssvc`) is acceptable **only** for the import alias
  itself; local variables must use the full name (`kubernetesService`).
- The Cloudflare SDK (`github.com/cloudflare/cloudflare-go/v6`) is imported as
  `cloudflareSDK` inside `internal/cloudflare/cloudflare.go` to avoid a name
  collision with the package itself.

## Constants over literals

All domain-specific string and duration literals must be named constants:

| Constant | Value | Location |
|---|---|---|
| `catchAllRule` | `"http_status:404"` | `internal/cloudflare/cloudflare.go` |
| `tunnelSecretByteLength` | `32` | `internal/cloudflare/cloudflare.go` |
| `watchReconnectDelay` | `5 * time.Second` | `internal/k8s/k8s.go` |
| `tunnelAnnotation` | `"cloudflare.io/tunnel"` | `internal/k8s/k8s.go` |
| `tunnelTokenEnvVar` | `"TUNNEL_TOKEN"` | `internal/k8s/k8s.go` |
| `tunnelTokenSecretKey` | `"tunnelToken"` | `internal/k8s/k8s.go` |
| `pingGroupRangeName` | `"net.ipv4.ping_group_range"` | `internal/k8s/k8s.go` |
| `pingGroupRangeValue` | `"0 2147483647"` | `internal/k8s/k8s.go` |
| `secretKeyTunnelID` | `"tunnelID"` | `internal/controller/controller.go` |
| `secretKeyTunnelToken` | `"tunnelToken"` | `internal/controller/controller.go` |

## Zone filtering

If `ZoneDomain` is set in `ReconcileConfig` (from `CF_ZONE_NAME` env var), the controller
skips any hostname that is not the zone apex or a subdomain of it. The check uses a
dot-separated suffix match (`strings.HasSuffix(hostname, "."+zoneDomain)`) to prevent
`evil-example.com` from matching `example.com`.
