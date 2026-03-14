# Repository map

This map helps new contributors route changes quickly.

## Top-level folders

- `apps/`: application code and app charts.
- `platform/`: cluster/platform components managed through GitOps.
- `docs/`: documentation source, docker setup, and docs Helm chart.
- `.github/`: CI/CD and deployment workflows.
- `tools/`: utility scripts.

## Ownership heuristic

- If it changes runtime behavior of a platform service, start in `platform/`.
- If it changes user-facing product behavior, start in `apps/`.
- If it changes onboarding/knowledge flow, start in `docs/src/`.
- If it changes release automation, inspect `.github/workflows/`.
