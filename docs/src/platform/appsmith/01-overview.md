---
title: Overview
---

## What is Appsmith?

[Appsmith](https://www.appsmith.com/) is an open-source low-code platform for building internal tools and dashboards. It lets you connect to APIs and databases and build UIs without writing frontend code.

In Nexus it serves as the internal tooling layer — a place to build admin panels, data visualisations, or operational dashboards for side projects without spinning up a full frontend.

## Deployment

Appsmith runs in the cluster, deployed via Helm chart at [`platform/appsmith/`](https://github.com/kbntx-org/nexus/tree/main/platform/appsmith). It includes its own MongoDB and Redis instances as dependencies.

It is exposed through the standard Cloudflare Tunnel + Traefik path, the same as every other service.

## References

- [`platform/appsmith/`](https://github.com/kbntx-org/nexus/tree/main/platform/appsmith) — Helm chart and configuration
- [Appsmith documentation](https://docs.appsmith.com/)
