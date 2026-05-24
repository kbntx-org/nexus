---
title: Nexus - Monitoring & Observability
description: Lightweight Kubernetes-native observability stack with Grafana, VictoriaMetrics, Loki, and automated S3 backups.
tech:
  - Kubernetes
  - VictoriaMetrics
  - Grafana
  - Loki
  - Promtail
  - PostgreSQL
  - S3
logo: https://nexus-public-assets.kbntx.com/images/grafana-logo.svg
images:
  - https://nexus-public-assets.kbntx.com/images/ingress-nginx-dashboard.png
  - https://nexus-public-assets.kbntx.com/images/node-k8s-dashboard.png
  - https://nexus-public-assets.kbntx.com/images/api-server-dashboard.png
githubUrl: https://github.com/kbntx-org/nexus
features:
  - VictoriaMetrics metrics collection with live S3 backups
  - Autodiscovery of cluster metrics with kube-state-metrics and node-exporter
  - Loki for centralized logging aggregation
  - Grafana dashboards for system, cluster, and application insights
  - Grafana alerting for node and application health alerts
  - Kuma uptime integration for application health monitoring
  - Ingress-nginx observability (traffic, domains, error ratios)
  - Reusable lightweight helm chart
  - Stateful services with recurrent backup in S3
---

Nexus is my homelab project where I experiment with building a production-grade observability platform.

<br>

The stack provides full monitoring, logging, and alerting for Kubernetes clusters and hosted applications. VictoriaMetrics replaces Prometheus to enable seamless live backups to S3, reducing operational complexity and ensuring resilience. Combined with Grafana dashboards, Loki logs, and GitOps workflows via ArgoCD, the system offers real-time visibility, disaster recovery, and streamlined deployments.
