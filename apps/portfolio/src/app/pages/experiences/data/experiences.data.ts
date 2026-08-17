export interface Role {
  title: string;
  duration: string;
  description: string;
  highlights?: string[];
  technologies: string[];
}

export interface Experience {
  company: string;
  companyLogo?: string;
  location: string;
  duration: string;
  description: string;
  roles: Role[];
}

export const EXPERIENCES: Experience[] = [
  {
    company: 'PowerUs (YC S20)',
    location: 'Berlin, Germany',
    duration: '2022 - Present',
    description:
      'PowerUs helps workers find the best jobs, discover new companies & industries, connect with other workers and get further education. On the other side, PowerUs helps attractive employers find these workers to fulfill their projects and grow.',
    roles: [
      {
        title: 'Senior Platform Engineer',
        duration: 'November 2024 - Present',
        description:
          'As a Senior Platform Engineer at PowerUs, I focused on improving developer experience, reliability, and delivery speed by evolving our cloud and Kubernetes platform. I worked across teams to build a fast, safe, and self-service path from idea to production.',
        highlights: [
          'Replaced 5 static staging environments with unlimited on-demand preview environments with a custom Kubernetes controller, provisioned in minutes from a GitHub label, used across engineering, design, and product',
          'Migrated self-hosted RabbitMQ to an HA Amazon MQ cluster with zero downtime, reducing operational burden and enabling future use as an event bus',
          'Drove the zero-downtime migration from DigitalOcean to AWS, resolving service reliability issues, introducing granular access control, and unlocking a broader cloud services catalog',
          'Migrated from Docker Compose to Kubernetes on EKS, replacing fragmented per-service operations with a unified platform for deployments, recovery, configuration management, and engineer self-service via ArgoCD',
          'Revamped CI/CD pipelines with GitHub Actions, ArgoCD, and self-hosted ARC runners, cutting P95 from 20 to 10 minutes, reducing CI costs by 40%, and increasing deployment frequency from 1-2/day to 20-25/day',
          'Built a self-service local dev environment with full production parity, cutting onboarding to under 5 minutes, and extended into self-hosted Coder workspaces for AI agents and non-engineers to experiment independently',
          'Hardened the security posture with Cloudflare, zero-trust access (Cloudflare Access, WARP), private-only infrastructure, and VPC-based access for critical systems, enabling faster response to scraping attacks through improved rate limiting and bot detection',
          'Launched a platform guild, hands-on workshops (AWS, Terraform, Kubernetes), and regular office hours to spread platform knowledge and build team autonomy across product squads and the on-call rotation'
        ],
        technologies: [
          'Kubernetes',
          'AWS',
          'Terraform',
          'ArgoCD',
          'Helm',
          'Karpenter',
          'GitHub Actions',
          'Cloudflare',
          'HashiCorp Vault',
          'Sentry',
          'Datadog',
          'Grafana',
          'VictoriaMetrics',
          'Docker',
          'Nginx',
          'Linux',
          'Bash',
          'Jsonnet',
          'TypeScript',
          'Go',
          'NestJS',
          'Angular',
          'NX',
          'MongoDB',
          'RabbitMQ',
          'Amazon MQ',
          'Tilt',
          'Coder Workspaces',
          'Sysbox',
          'REST APIs',
          'Node.js',
          'Amazon S3',
          'Cypress',
          'GitHub',
          'Drone CI'
        ]
      },
      {
        title: 'Senior Full Stack & DevOps Engineer',
        duration: 'May 2023 - November 2024',
        description:
          'As a Senior Full-Stack & DevOps Engineer in the Marketplace squad, I worked on improving product performance and scalability while progressively taking ownership of infrastructure and DevOps topics. This role marked my transition from product engineering to platform-focused work.',
        highlights: [
          'Led improvements to the job matching system, reducing average execution time by 68% and enhancing content delivery and personalization',
          'Migrated DigitalOcean infrastructure from ClickOps to Terraform IaC, consolidating into the monorepo for full visibility, reducing environment provisioning to a single config change',
          'Upgraded outdated frameworks (Angular, NestJS, NX) and modernized build tooling (esbuild, SWC) across frontend and backend, cutting CI time from 50 to 20 minutes and reducing test flakiness',
          'Rolled out Datadog observability across the organization, giving teams real-time telemetry that surfaced previously undetected issues, driving targeted refactoring and improving incident detection and response',
          'Supported the data chapter with BigQuery permissions and tooling integration across their pipeline (DBT, Fivetran, BigQuery, CI/CD)',
          'Mentored and onboarded junior engineers on best practices, architecture, and product domain knowledge, enabling them to ship features independently and confidently'
        ],
        technologies: [
          'RabbitMQ',
          'REST APIs',
          'MongoDB',
          'Node.js',
          'Angular',
          'Cypress',
          'CapacitorJS',
          'DigitalOcean',
          'TypeScript',
          'Bash',
          'NestJS',
          'Datadog',
          'NX',
          'Docker',
          'GitHub',
          'Drone CI',
          'HashiCorp Vault',
          'Fastlane',
          'Terraform',
          'Storybook',
          'GitHub Actions',
          'Progressive Web Applications (PWAs)',
          'Mobile Application Development'
        ]
      },
      {
        title: 'Full Stack & DevOps Engineer',
        duration: 'July 2022 - May 2023',
        description:
          'As a Full-Stack & DevOps Engineer in the Network squad, I contributed to user engagement and retention features while taking ownership of mobile development and improving delivery workflows.',
        highlights: [
          'Promoted from Junior Full-Stack Engineer after 3 months, following contributions to sign-up funnels, landing pages, and public job search features that drove user acquisition',
          'Shipped the iOS mobile app using CapacitorJS with live update and full continuous delivery support. Mobile users showed 30% higher activity than web users',
          'Deployed a long-lived product environment reflecting the latest stable state of the app, giving PMs and designers a stable space to explore features outside the standard test environments',
          'Introduced HashiCorp Vault for remote configuration management, decreasing incident response time related to configuration and reducing the number of builds in the CI'
        ],
        technologies: [
          'RabbitMQ',
          'REST APIs',
          'MongoDB',
          'Node.js',
          'Progressive Web Applications (PWAs)',
          'Angular',
          'Cypress',
          'CapacitorJS',
          'DigitalOcean',
          'TypeScript',
          'Bash',
          'NestJS',
          'Datadog',
          'NX',
          'Docker',
          'GitHub',
          'Drone CI',
          'HashiCorp Vault',
          'Fastlane',
          'GitHub Actions',
          'Mobile Application Development',
          'Mixpanel',
          'Google Tag Manager',
          'Google Ads'
        ]
      }
    ]
  },
  {
    company: 'APOLLO | CODING LIFE',
    location: 'Lyon, Auvergne-Rhône-Alpes, France',
    duration: '2020 - 2022',
    description:
      'Apollo is a Lyon-based IT consulting company specializing in custom software development. The R&D department delivers full-stack solutions across healthcare, energy, and enterprise projects.',
    roles: [
      {
        title: 'Software Engineer',
        duration: 'September 2021 - June 2022',
        description:
          'Full-stack development across healthcare, energy, and enterprise projects (React, Angular, .NET 6, Azure), building internal tools with role-based access and Microsoft Graph API integration.',

        technologies: [
          'REST APIs',
          'Microsoft Azure',
          'Node.js',
          'Angular',
          'React',
          'TypeScript',
          'Docker',
          '.NET 6',
          'SQL Server',
          'Azure DevOps',
          'Entity Framework',
          'Cucumber.js'
        ]
      },
      {
        title: 'Software Engineer Intern',
        duration: 'June 2020 - August 2020',
        description:
          'Contributed to the redesign of a back-office application used to manage course catalogs, working in a SCRUM team on both frontend and backend features.',

        technologies: [
          'Angular',
          'TypeScript',
          '.NET Core',
          'Azure DevOps',
          'Entity Framework',
          'REST APIs'
        ]
      }
    ]
  }
];
