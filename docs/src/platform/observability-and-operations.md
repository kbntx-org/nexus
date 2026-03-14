# Observability and operations

## Monitoring stack

Monitoring resources are under `platform/monitoring` and are deployed by ArgoCD app-of-apps.

## Operations components

- `platform/k3s-upgrades` for controlled cluster upgrades.
- `platform/github-arc-runners` for CI runners on cluster.
- `platform/external-secrets` for secret sync patterns.

## Suggested operational loop

1. Detect issue in dashboard/alerts.
2. Identify owning component path in repo.
3. Prepare a Git change with rollback plan.
4. Merge and verify ArgoCD reconciliation.
