---
title: Welcome
---

# Nexus 🚀

> **Platform Engineering Hub** - From ideation to delivery and continuous monitoring

Nexus is my personal platform engineering playground where I experiment with modern technologies and build applications in real-world conditions. This repository serves as a hub for all my tools, applications, and platform engineering experiments.

## 🎯 Vision

Nexus represents the evolution from my previous homelab repository. While homelab was focused on experimenting with individual technologies, Nexus is about applying **platform engineering principles** to create a comprehensive ecosystem that supports the entire software development lifecycle.

### Core Philosophy

- **End-to-End Development**: From ideation to delivery and continuous monitoring
- **Platform Engineering**: Standardized deployment, monitoring, and infrastructure management
- **Real-World Conditions**: Building applications that mirror production environments
- **Technology Exploration**: Experimenting with cutting-edge tools and practices

## 🏗️ Architecture

### Platform Components

- **Kubernetes Cluster**: Container orchestration and deployment
- **Infrastructure as Code**: Terraform for cloud resource provisioning
- **GitOps Workflow**: ArgoCD for continuous deployment
- **Monitoring Stack**: Grafana + Prometheus for observability
- **TypeScript Packages**: Shared libraries for platform communication
- **Standardized CI/CD**: Automated testing and deployment pipelines

### Current Applications

- **Portfolio Frontend**: Angular-based personal portfolio showcasing platform engineering skills
- **Backend Services**: API services and microservices (planned)
- **Monitoring Dashboards**: Custom Grafana dashboards for platform metrics
- **Infrastructure Tools**: Terraform modules and Kubernetes manifests

## 🛠️ Technology Stack

### Frontend

- **Angular 20**: Modern web framework with TypeScript
- **Tailwind CSS**: Utility-first CSS framework
- **Nx**: Monorepo build system and development tools

### Platform & Infrastructure

- **Kubernetes**: Container orchestration
- **Terraform**: Infrastructure as Code
- **ArgoCD**: GitOps continuous deployment
- **Prometheus**: Metrics collection and monitoring
- **Grafana**: Visualization and alerting

### Development Tools

- **TypeScript**: Type-safe JavaScript development
- **Jest**: Unit testing framework
- **ESLint**: Code linting and quality
- **pnpm**: Fast, disk space efficient package manager

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Docker (for containerized development)
- kubectl (for Kubernetes operations)

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/kbntx/nexus.git
   cd nexus
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start the development server**

   ```bash
   # Start the portfolio frontend
   pnpm nx serve portfolio

   # Or run all applications
   pnpm nx run-many --target=serve --all
   ```

### Available Commands

```bash
# Development
pnpm nx serve portfolio    # Start portfolio frontend
pnpm nx build portfolio    # Build portfolio frontend
pnpm nx test portfolio     # Run tests
pnpm nx lint portfolio     # Lint code

# Platform operations
pnpm nx graph                       # View project dependency graph
pnpm nx affected:graph              # View affected projects
```

## 📁 Project Structure

```
nexus/
├── apps/
│   └── portfolio/
│       ├── frontend/              # Angular portfolio application
│       └── backend/               # Backend services (planned)
├── libs/                          # Shared libraries and packages
├── infrastructure/                # Terraform and Kubernetes manifests
├── monitoring/                    # Grafana dashboards and Prometheus configs
└── docs/                         # Documentation and guides
```

## 🎯 Roadmap

### Phase 1: Foundation ✅

- [x] Nx monorepo setup
- [x] Portfolio frontend with Angular
- [x] Basic CI/CD pipeline
- [x] Development environment

### Phase 2: Platform Infrastructure 🚧

- [ ] Kubernetes cluster setup
- [ ] Terraform infrastructure modules
- [ ] ArgoCD GitOps workflow
- [ ] Monitoring stack deployment

### Phase 3: Applications & Services 📋

- [ ] Backend API services
- [ ] Microservices architecture
- [ ] Database and storage solutions
- [ ] Authentication and authorization

### Phase 4: Advanced Platform Features 📋

- [ ] Self-service developer portal
- [ ] Advanced monitoring and alerting
- [ ] Security scanning and compliance
- [ ] Performance optimization

## 🤝 Contributing

This is a personal project, but I welcome feedback and suggestions! Feel free to:

- Open issues for bugs or feature requests
- Submit pull requests for improvements
- Share ideas for new platform features

## 📊 Platform Metrics

- **Build Time**: Optimized with Nx caching
- **Test Coverage**: Comprehensive unit and integration tests
- **Deployment Frequency**: Continuous deployment with ArgoCD
- **Platform Uptime**: 99.9% target with monitoring

## 🔗 Links

- **Portfolio**: [Live Demo](https://your-portfolio-url.com)
- **LinkedIn**: [Kenny Talbi](https://www.linkedin.com/in/kennytalbi)
- **GitHub**: [@kbntx](https://github.com/kbntx)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ and platform engineering principles**

_Nexus - Where ideas become reality through platform engineering_
