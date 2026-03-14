# GitOps and delivery

## What happens after merge to main

1. `checks-main` runs lint, format and tests.
2. Deployment workflows build and push application images.
3. ArgoCD syncs applications from repository paths.

## Why this matters

Operationally, the **path in Git** is the source of truth. If folders move, workflow and ArgoCD paths must be updated together.

## Key files

- `.github/workflows/checks-main.yml`
- `.github/workflows/deploy-documentation.yml`
- `platform/app-of-apps/values.yaml`

## Change safely checklist

- For path changes, search the repo for old path references.
- For image changes, verify workflow build context and Dockerfile path.
- For chart changes, confirm app-of-apps `source.path` remains valid.
