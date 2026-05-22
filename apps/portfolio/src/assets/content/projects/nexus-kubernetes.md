---
title: Nexus - Kubernetes & Compute Platform
description: A production-ready Kubernetes infrastructure built on Hetzner Cloud, featuring K3s cluster, Terraform automation, and comprehensive networking setup.
tech:
  - Kubernetes
  - K3s
  - Terraform
  - Hetzner Cloud
  - Ingress-nginx
  - Cloudflared
  - ArgoCD
  - GitOps
  - Helm
  - YAML
  - Infrastructure as Code
  - Distributed system
  - Recovery strategy
logo: https://nexus-public-assets.kbntx.com/images/kubernetes-logo.svg
images:
  - https://nexus-public-assets.kbntx.com/images/k3s-cluster-schema.png
githubUrl: https://github.com/kbntx-org/nexus
features:
  - K3s cluster with multi-node setup
  - Terraform module for minimal initialization
  - Cloudflared for secure tunneling and edge protection
  - Backup and disaster recovery automation
  - Gitops driven development with ArgoCD to minimize recovery while having flexibility
  - Standardized deployments
---

Designed and implemented a scalable Kubernetes platform using K3s on Hetzner Cloud. K3s was chosen because it's a lightweight kubernetes distribution and it comes with some batteries that makes its implementation easier. The foundational infrastructure is fully automated with a terraform module based on a system of node-pools.

<br>

The cluster comes with a few batteries included like ArgoCD, ingress-nginx, the hetzner CSI and finally cloudflared to expose services to the internet. The platform is following GitOps principles as much as possible to have a minimum recovery time in case of disaster. Workloads are mostly stateless and for the stateful ones, an aggresive backup strategy is applied to avoid data loss in case of incident.
