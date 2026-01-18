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
  - Hetzner Cloud
  - Cloudflare
  - S3
  - Helm
  - GitOps
  - ArgoCD
logo: https://nbg1.your-objectstorage.com/nexus-public-statics/images/grafana-logo.svg
images:
  - https://nbg1.your-objectstorage.com/nexus-public-statics/images/ingress-nginx-dashboard.png
  - https://nbg1.your-objectstorage.com/nexus-public-statics/images/node-k8s-dashboard.png
  - https://nbg1.your-objectstorage.com/nexus-public-statics/images/api-server-dashboard.png
codeSourceUrl: /code-source/nexus
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
