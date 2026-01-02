export interface Project {
  id: string;
  title: string;
  description: string;
  tech: string[];
  longDescription?: string;
  features?: string[];
  liveUrl?: string;
  githubUrl?: string;
  images?: string[];
  logo?: string;
}

export const PROJECTS: Project[] = [
  {
    id: 'nexus-observability',
    title: 'Nexus - Monitoring & Observability',
    description:
      'Lightweight Kubernetes-native observability stack with Grafana, VictoriaMetrics, Loki, and automated S3 backups.',
    tech: [
      'Kubernetes',
      'VictoriaMetrics',
      'Grafana',
      'Loki',
      'Promtail',
      'PostgreSQL',
      'Hetzner Cloud',
      'Cloudflare',
      'S3',
      'Helm',
      'GitOps',
      'ArgoCD'
    ],
    logo: 'https://nbg1.your-objectstorage.com/nexus-public-statics/images/grafana-logo.svg',
    images: [
      'https://nbg1.your-objectstorage.com/nexus-public-statics/images/ingress-nginx-dashboard.png',
      'https://nbg1.your-objectstorage.com/nexus-public-statics/images/node-k8s-dashboard.png',
      'https://nbg1.your-objectstorage.com/nexus-public-statics/images/api-server-dashboard.png'
    ],
    longDescription: `Nexus is my homelab project where I experiment with building a production-grade observability platform. <br/><br/>
    The stack provides full monitoring, logging, and alerting for Kubernetes clusters and hosted applications.
    VictoriaMetrics replaces Prometheus to enable seamless live backups to S3, reducing operational complexity and ensuring resilience.
    Combined with Grafana dashboards, Loki logs, and GitOps workflows via ArgoCD, the system offers real-time visibility, disaster recovery, and streamlined deployments.`,
    features: [
      'VictoriaMetrics metrics collection with live S3 backups',
      'Autodiscovery of cluster metrics with kube-state-metrics and node-exporter',
      'Loki for centralized logging aggregation',
      'Grafana dashboards for system, cluster, and application insights',
      'Grafana alerting for node and application health alerts',
      'Kuma uptime integration for application health monitoring',
      'Ingress-nginx observability (traffic, domains, error ratios)',
      'Reusable lightweight helm chart',
      'Stateful services with recurrent backup in S3'
    ]
  },
  {
    id: 'nexus-kubernetes',
    title: 'Nexus - Kubernetes & Compute Platform',
    description:
      'A production-ready Kubernetes infrastructure built on Hetzner Cloud, featuring K3s cluster, Terraform automation, and comprehensive networking setup.',
    tech: [
      'Kubernetes',
      'K3s',
      'Terraform',
      'Hetzner Cloud',
      'Ingress-nginx',
      'Cloudflared',
      'ArgoCD',
      'GitOps',
      'Helm',
      'YAML',
      'Infrastructure as Code',
      'Distributed system',
      'Recovery strategy'
    ],
    logo: 'https://nbg1.your-objectstorage.com/nexus-public-statics/images/kubernetes-logo.svg',
    images: [
      'https://nbg1.your-objectstorage.com/nexus-public-statics/images/k3s-cluster-schema.png'
    ],
    longDescription: `Designed and implemented a scalable Kubernetes platform using K3s on Hetzner Cloud.
      K3s was chosen because it's a lightweight kubernetes distribution and it comes with some batteries that makes its implementation easier.
      The foundational infrastructure is fully automated with a terraform module based on a system of node-pools.
      <br><br>
      The cluster comes with a few batteries included like ArgoCD, ingress-nginx, the hetzner CSI and finally cloudflared to expose services to the internet.
      The platform is following GitOps principles as much as possible to have a minimum recovery time in case of disaster.
      Workloads are mostly stateless and for the stateful ones, an aggresive backup strategy is applied to avoid data loss in case of incident.`,
    features: [
      'K3s cluster with multi-node setup',
      'Terraform module for minimal initialization',
      'Cloudflared for secure tunneling and edge protection',
      'Backup and disaster recovery automation',
      'Gitops driven development with ArgoCD to minimize recovery while having flexibility',
      'Standardized deployments'
    ]
  },
  {
    id: 'internal-tooling-with-appsmith',
    title: 'Nexus - Internal Tooling',
    description:
      'Self-hosted Appsmith platform for building internal tools with a low-code approach.',
    tech: ['MongoDB', 'Redis', 'Appsmith', 'Kubernetes', 'Cloudflare', 'S3'],
    logo: 'https://nbg1.your-objectstorage.com/nexus-public-statics/images/appsmith-logo.png',
    images: [
      'https://nbg1.your-objectstorage.com/nexus-public-statics/images/cloudflare-tunnel-1.png',
      'https://nbg1.your-objectstorage.com/nexus-public-statics/images/cloudflare-tunnel-2.png',
      'https://nbg1.your-objectstorage.com/nexus-public-statics/images/s3-statics-client-1.png'
    ],
    longDescription: `The goal of this project is to provide a platform to build internal tools with a low-code approach.
      It enables engineers for quick experimentation with 3rd party services like MongoDB, Redis, S3, custom APIs, etc.
      It also allows all departments to build their own tools to improve their daily workflow with pre-created components and datasources.
      The balance of javascript usage and low-code approach really widen the possibilities of what can be built with the platform.
      <br><br>
      Appsmith is self-hosted on a kubernetes cluster, the components are a mongoDB database as main storage, redis for caching and the main appsmith backend.
      Recurrent backups are ran on the mongoDB database and the overall platform is SSO.
      `,
    features: [
      'Easy platform to build internal tools with a low-code approach',
      'Recurrent backups of the mongoDB database',
      'SSO for the platform',
      'Possibility to create custom components with react/vue.js and custom datasources (like a cloudflare api integration)',
      'Application 1: Self-service Cloudflare tunnel creation - engineers can create their own locally-managed tunnels, allowing them to share development environments with teammates',
      'Application 2: S3 static asset management - upload public static assets for portfolio and other applications'
    ]
  },
  {
    id: 'portfolio-website',
    title: 'Portfolio',
    description:
      'A modern, responsive portfolio website built with Angular to showcase my projects and experiences.',
    tech: ['Angular', 'TypeScript', 'Nx', 'Tailwind CSS', 'RxJS', 'Pre-rendering', 'S3'],
    logo: 'https://nbg1.your-objectstorage.com/nexus-public-statics/images/kt-logo.jpg',
    images: [
      'https://nbg1.your-objectstorage.com/nexus-public-statics/images/portfolio-cv.png',
      'https://nbg1.your-objectstorage.com/nexus-public-statics/images/portfolio-experiences.png',
      'https://nbg1.your-objectstorage.com/nexus-public-statics/images/portfolio-homepage.png',
      'https://nbg1.your-objectstorage.com/nexus-public-statics/images/portfolio-projects-dark-mode.png',
      'https://nbg1.your-objectstorage.com/nexus-public-statics/images/portfolio-projects-light-mode.png'
    ],
    longDescription:
      'A modern, responsive portfolio website showcasing my different projects and experiences. Built with Angular, it is featuring smooth animations, dark/light theme switching. It is was also optimized by using pre-rendering.',
    features: [
      'Dark/light theme support',
      'Declarative content management to keep a low maintenance cost',
      'Pre-rendering for performance optimization'
    ]
  }
];
