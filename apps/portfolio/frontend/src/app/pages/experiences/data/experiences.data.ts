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
        title: 'Staff Platform Engineer',
        duration: 'March 2026 - Present',
        description:
          'Defining platform strategy and technical direction across the engineering organization, driving cross-team alignment on infrastructure, developer experience, and delivery standards.',

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
          'REST APIs',
          'Node.js',
          'Amazon S3'
        ]
      },
      {
        title: 'Senior Platform Engineer',
        duration: 'November 2024 - March 2026',
        description:
          'As a Senior Platform Engineer at PowerUs, I focused on improving developer experience, reliability, and delivery speed by evolving our cloud and Kubernetes platform. I worked across teams to build a fast, safe, and self-service path from idea to production.',
        highlights: [
          'Replaced 5 static staging environments with unlimited on-demand previews via ArgoCD ApplicationSets, provisioned in minutes from a GitHub label, used across engineering, design, and product',
          'Drove the zero-downtime migration from DigitalOcean to AWS, resolving service reliability issues, introducing granular access control, and unlocking a broader cloud services catalog',
          'Migrated from Docker Compose to Kubernetes on EKS, replacing fragmented per-service operations with a unified platform for deployments, recovery, configuration management, and engineer self-service via ArgoCD',
          'Revamped CI/CD pipelines with GitHub Actions and self-hosted ARC runners, cutting P95 from 20 to 10 minutes and reducing CI costs by 40%',
          'Rolled out continuous deployment with Argo Rollouts blue/green, increasing deployment frequency from 1-2/day to 20-25/day and reducing release risk',
          'Hardened the security posture implementing zero-trust access with Cloudflare (Access, WARP), private-only infrastructure, and VPC-based operational access for critical systems',
          'Built internal platform packages: service worker update mechanism, NestJS decorators for queue and log ownership, and a webhook fan-out dispatcher for preview environments',
          'Launched a platform guild, hands-on workshops (AWS, Terraform, Kubernetes), and regular office hours to spread platform knowledge and build team autonomy across product squads'
        ],
        technologies: [
          'Sentry',
          'Terraform',
          'RabbitMQ',
          'REST APIs',
          'MongoDB',
          'Node.js',
          'Nginx',
          'Angular',
          'Cypress',
          'TypeScript',
          'GitHub Actions',
          'Bash',
          'NestJS',
          'Datadog',
          'Jsonnet',
          'NX',
          'Docker',
          'GitHub',
          'Linux',
          'Drone CI',
          'HashiCorp Vault',
          'Amazon S3',
          'Kubernetes',
          'AWS',
          'ArgoCD',
          'Helm',
          'Karpenter',
          'Cloudflare'
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
          'Migrated frontends to Angular 17 with esbuild, set up Storybook with visual testing, cutting CI build times by 50% and reducing visual regression feedback loops',
          'Set up Datadog across the stack: agent deployment on all VMs, CI/CD observability, dashboards and monitors to support on-call rotation',
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
        duration: 'October 2022 - May 2023',
        description:
          'As a Full-Stack & DevOps Engineer in the Network squad, I contributed to user engagement and retention features while taking ownership of mobile development and improving delivery workflows.',
        highlights: [
          'Improved CI/CD pipelines from 50 mins to 20 mins, reduced E2E test flakiness, and automated mobile builds with GitHub Actions and Fastlane',
          'Shipped the iOS mobile app using CapacitorJS with live update support. Mobile users showed 30% higher activity than web users',
          'Migrated configuration management from build time to runtime reducing the numbers of build in CI from N (number of environments) to 1 and enabling more testing environments without impacting delivery performance',
          'Upgraded core frameworks (NX, NestJS, Angular) to improve developer experience, runtime and build performance',
          'Built community features (video uploads, reporting system) and integrated education modules to improve user retention'
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
          'Mobile Application Development'
        ]
      },
      {
        title: 'Junior Full Stack Engineer',
        duration: 'July 2022 - October 2022',
        description:
          'As a Junior Full-Stack Engineer in the Acquisition squad, I contributed to user acquisition features and frontend improvements supporting growth initiatives.',

        technologies: [
          'RabbitMQ',
          'Mixpanel',
          'REST APIs',
          'MongoDB',
          'Node.js',
          'Angular',
          'Cypress',
          'Google Tag Manager',
          'TypeScript',
          'NestJS',
          'Docker',
          'GitHub',
          'Drone CI',
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
