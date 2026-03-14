# Observability

The monitoring stack provides metrics, logs, and dashboards for the entire cluster and its workloads. It is deployed as a single Helm chart at `platform/monitoring/` that bundles all components.

## Stack overview

```mermaid
graph TB
    subgraph Sources["Data Sources"]
        NE[Node Exporter<br/>system metrics]
        KSM[Kube State Metrics<br/>K8s object metrics]
        Promtail[Promtail<br/>log collector]
    end

    subgraph Storage["Storage"]
        VM[VictoriaMetrics<br/>metrics TSDB]
        Loki[Loki<br/>log aggregation]
    end

    subgraph Viz["Visualisation"]
        Grafana
    end

    NE -->|"scrape"| VM
    KSM -->|"scrape"| VM
    Promtail -->|"push logs"| Loki
    VM -->|"query"| Grafana
    Loki -->|"query"| Grafana
```

## Components

| Component              | Version | Role                                                    |
| ---------------------- | ------- | ------------------------------------------------------- |
| **Grafana**            | 10.5.8  | Dashboards and alerting UI                              |
| **VictoriaMetrics**    | 0.24.6  | Prometheus-compatible time-series database              |
| **Loki**               | 6.40.0  | Log aggregation                                         |
| **Promtail**           | 6.17.1  | Log shipping agent (runs as DaemonSet)                  |
| **Kube State Metrics** | 6.4.2   | Exposes K8s object state as Prometheus metrics          |
| **Node Exporter**      | 4.48.0  | Exposes host-level metrics (CPU, memory, disk, network) |

All are deployed via their upstream Helm charts, composed in `platform/monitoring/Chart.yaml` as dependencies.

## Metrics flow

```mermaid
sequenceDiagram
    participant NE as Node Exporter
    participant KSM as Kube State Metrics
    participant VM as VictoriaMetrics
    participant Grafana

    loop every 15s (scrape interval)
        VM->>NE: GET /metrics
        NE->>VM: text/plain metrics
        VM->>KSM: GET /metrics
        KSM->>VM: text/plain metrics
        VM->>VM: store time series
    end

    Grafana->>VM: PromQL query
    VM->>Grafana: time series data
```

## Log flow

```mermaid
sequenceDiagram
    participant Pod as Application Pod
    participant Promtail
    participant Loki
    participant Grafana

    Pod->>Pod: write to stdout/stderr
    Promtail->>Pod: tail container logs (via node file)
    Promtail->>Loki: push log stream (labels + lines)
    Grafana->>Loki: LogQL query
    Loki->>Grafana: log lines
```

Promtail runs as a `DaemonSet` — one instance per node — and automatically discovers all pods, tagging logs with namespace, pod name, and container name.

## Accessing Grafana

Grafana is exposed at `grafana.kbntx.com`. Default credentials are managed via Vault + ESO.

Useful dashboards available out of the box:

- **Kubernetes / Cluster** — node resource usage
- **Kubernetes / Workloads** — pod CPU/memory per namespace
- **Loki / Logs** — explore logs across all namespaces
- **Node Exporter Full** — detailed host metrics

## Adding custom metrics

Any application that exposes a `/metrics` endpoint in Prometheus format can be scraped by VictoriaMetrics. Add a `ServiceMonitor` or configure scrape targets in `platform/monitoring/values.yaml`.
