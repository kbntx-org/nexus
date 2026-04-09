export interface Role {
  title: string;
  duration: string;
  description: string;
  highlights: string[];
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
        highlights: [],
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
          'Infrastructure & Platform Foundations: Led migration from DigitalOcean to AWS and introduced Kubernetes with zero downtime, enabling self-service, faster experimentation, and improved incident response',
          'CI/CD & Delivery: Revamped pipelines (P95 20 to 10 min, -40% cost) through caching and E2E sharding, and enabled continuous deployment (1-2 to 20-25 deploys/day)',
          'Developer Experience: Designed and rolled out PR preview environments and production-like local setups with real domains and Cloudflare tunnels, accelerating onboarding and feedback loops',
          'Platform Adoption & Security: Strengthened platform usage and autonomy through workshops and a platform guild, while implementing zero-trust access (Cloudflare Access/WARP, private infrastructure, VPC-based access)'
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
          'Product Performance & Matching: Improved the job matching system, reducing execution time by 68% and enhancing personalization and content delivery',
          'Infrastructure as Code: Introduced Terraform to manage infrastructure and standardize environment provisioning, improving visibility and reproducibility',
          'Frontend & Developer Experience: Migrated frontends to Angular 17 and introduced Storybook with visual testing, reducing build times by ~50% and improving design system quality',
          'DevOps & Team Enablement: Contributed to internal tooling, observability integrations, and supported onboarding and mentoring of engineers across the team'
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
          'Mobile Development: Led the development and launch of the iOS app using Capacitor, including support for live updates of non-native code',
          'CI/CD & Delivery: Improved pipelines (50 to 20 min), reduced E2E test flakiness, and automated mobile builds with GitHub Actions and Fastlane',
          'Product Features: Built community and education features (video uploads, reporting system, learning modules) to improve user engagement and retention',
          'Platform & DevOps Foundations: Contributed to Angular upgrades (v12 to v16), runtime secret management, and environment setup across the stack'
        ],
        technologies: [
          'Angular',
          'TypeScript',
          'NestJS',
          'CapacitorJS',
          'NX',
          'Fastlane',
          'GitHub Actions',
          'Drone CI',
          'Cypress',
          'MongoDB',
          'RabbitMQ',
          'Docker',
          'HashiCorp Vault',
          'DigitalOcean'
        ]
      },
      {
        title: 'Junior Full Stack Engineer',
        duration: 'July 2022 - October 2022',
        description:
          'As a Junior Full-Stack Engineer in the Acquisition squad, I contributed to user acquisition features and frontend improvements supporting growth initiatives.',
        highlights: [
          'Built and improved sign-up funnels, landing pages, and the public job search experience',
          'Integrated Google Ads to align marketing campaigns with product features',
          'Refactored frontend components to improve maintainability and align with evolving architecture'
        ],
        technologies: [
          'Angular',
          'TypeScript',
          'NestJS',
          'MongoDB',
          'RabbitMQ',
          'Cypress',
          'Docker',
          'Drone CI',
          'Google Ads',
          'Google Tag Manager'
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
          'As a Software Engineer at Apollo Coding Life, I worked across multiple projects in healthcare, energy, and enterprise, delivering full-stack solutions and contributing to system modernisation efforts in Agile teams.',
        highlights: [
          'Full-Stack Development: Built internal platforms with role-based access and Microsoft Graph integration (React, .NET, Azure)',
          'Product & UX Improvements: Contributed to redesign of a health insurance sign-up and quote flow, improving performance and user experience',
          'System Modernisation: Participated in Angular (v6 to v13) and .NET upgrades across projects, improving maintainability and scalability',
          'Project Delivery: Developed a quote generation tool later integrated into the REXEL marketplace'
        ],
        technologies: [
          'Angular',
          'React',
          'TypeScript',
          '.NET 6',
          'SQL Server',
          'Microsoft Azure',
          'Azure DevOps',
          'Entity Framework',
          'Cucumber.js',
          'Docker',
          'REST APIs'
        ]
      },
      {
        title: 'Software Engineer Intern',
        duration: 'June 2020 - August 2020',
        description:
          'As a Software Engineer Intern, I contributed to the redesign of a back-office application used to manage course catalogs, working in a SCRUM team on both frontend and backend features.',
        highlights: [
          'Developed frontend and backend features using Angular and .NET',
          'Participated in database design and feature discussions to align with business needs',
          'Collaborated in an Agile team to deliver a more maintainable and scalable system'
        ],
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
