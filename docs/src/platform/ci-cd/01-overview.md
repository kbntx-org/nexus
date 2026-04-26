---
title: Overview
---

## What We Use

**GitHub Actions** for CI/CD. It was chosen because:

- Best developer experience on the market — tight integration with pull requests, branch protection, and code review
- Works natively with Kubernetes (the runners run inside the cluster, see below)
- Rich ecosystem of actions for every integration we need

## Runners

CI jobs don't run on GitHub-hosted machines — they run on **self-hosted runners inside the Kubernetes cluster**, managed by the [Actions Runner Controller (ARC)](https://github.com/actions/actions-runner-controller).

ARC is a Kubernetes operator. When a workflow is triggered, it spins up a runner pod, runs the job, and deletes the pod when done. No idle VMs, no per-minute billing — compute that's already paid for.

The runner configuration lives at [`platform/core/github-arc-runners/`](https://github.com/kbntx-org/nexus/tree/main/platform/core/github-arc-runners).

### Security

CI runners executing arbitrary code inside the cluster is a security concern — a compromised workflow could talk to internal services or exfiltrate secrets.

To prevent this, every runner pod gets a **NetworkPolicy** that restricts egress: runner pods can only reach the internet. All cluster-internal CIDRs (pod network and service network) are blocked.

The policy is defined at [`platform/core/github-arc-runners/runners/templates/network-policy.yaml`](https://github.com/kbntx-org/nexus/blob/main/platform/core/github-arc-runners/runners/templates/network-policy.yaml).

## CI Toolkit Image

All workflows use a single custom Docker image that bundles every tool needed to run CI:

```
platform/services/custom-docker-images/
```

This avoids per-job setup steps and keeps the individual workflow files short. The image includes tools like `kubectl`, the ArgoCD CLI, `buildctl`, `pnpm`, and anything else the pipelines need.

## Delivery Flow

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    Branch -->|open PR| PR[Pull Request]
    PR -->|CI: lint + test| Review[Code Review]
    Review -->|merge| Main[main branch]
    Main -->|CI: lint + test + build| Deploy[Deploy each app]
    Deploy -->|argocd sync| Cluster[K8S Cluster]
```

1. **Branch** — developer opens a pull request
2. **PR CI** — lint and tests run on the PR; merge is blocked until they pass
3. **Merge to main** — lint and tests run again, then each affected application is built, pushed to the registry, and deployed via an ArgoCD sync
4. **ArgoCD sync** — the CI pipeline triggers the sync and waits for the application to report healthy before marking the job as successful

Deployments are always triggered by CI — applications don't have ArgoCD auto-sync enabled. This ensures the image is pushed and the manifest is updated before ArgoCD tries to deploy.

## References

- [`platform/core/github-arc-runners/`](https://github.com/kbntx-org/nexus/tree/main/platform/core/github-arc-runners) — ARC controller and runner Helm charts
- [`platform/services/custom-docker-images/`](https://github.com/kbntx-org/nexus/tree/main/platform/services/custom-docker-images) — CI toolkit image
- [`.github/workflows/`](https://github.com/kbntx-org/nexus/tree/main/.github/workflows) — workflow definitions
- [Actions Runner Controller](https://github.com/actions/actions-runner-controller)
