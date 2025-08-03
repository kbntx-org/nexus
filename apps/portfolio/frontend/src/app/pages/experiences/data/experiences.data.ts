export interface Role {
  title: string;
  duration: string;
  responsibilities: string[];
  achievements: string[];
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
    description: 'PowerUs helps workers find the best jobs, discover new companies & industries, connect with other workers and get further education. On the other side, PowerUs helps attractive employers find these workers to fulfill their projects and grow.',
    roles: [
      {
        title: 'Senior Platform Engineer',
        duration: 'November 2024 - Present',
        responsibilities: [
          'Lead initiatives around developer experience, observability, self-service, cloud services and CI/CD acceleration',
          'Build and maintain foundational systems, tools, and services that empower product teams',
          'Ensure engineers can focus on delivering value without worrying about underlying infrastructure',
          'Participate in weekly on-call rotation to ensure systems are up and running'
        ],
        achievements: [
          'Participated in continuous deployment project, improving deployment frequency from 1-2 per day to every 30 minutes',
          'Led migration to Kubernetes with ArgoCD for GitOps and Karpenter for autoscaling, standardizing deployments and improving incident response',
          'Spearheaded infrastructure migration from DigitalOcean to AWS with zero downtime, providing broader range of services',
          'Implemented GitHub Actions integrated with Kubernetes to enhance developer experience and reliability'
        ],
        technologies: ['Kubernetes', 'ArgoCD', 'AWS', 'GitHub Actions', 'Terraform', 'Angular', 'NestJS', 'Python']
      },
      {
        title: 'Senior Full Stack & DevOps Engineer',
        duration: 'May 2023 - November 2024',
        responsibilities: [
          'Work in the Job Match Squad focusing on UI/UX for job presentation and matching quality',
          'Second in charge of DevOps team and go-to person for mobile development',
          'Support and iterate on mobile development initiatives',
          'Enhance user personalization in job searches and optimize job queue system'
        ],
        achievements: [
          'Improved job matching system reducing average execution time by 68%',
          'Set up Storybook infrastructure and implemented visual testing',
          'Changed ETL process from MongoDB to BigQuery, reducing costs by switching to data-transferred pricing',
          'Introduced Terraform to automate environment provisioning and increase infrastructure visibility'
        ],
        technologies: ['Angular', 'MongoDB', 'BigQuery', 'Terraform', 'Storybook', 'CapacitorJS']
      },
      {
        title: 'Full Stack & DevOps Engineer',
        duration: 'October 2022 - May 2023',
        responsibilities: [
          'Work in the Network Squad focusing on community and education projects',
          'Implement community platform features for blue-collar workers interaction',
          'Develop education module with courses, videos, PDFs, quizzes, and certification',
          'Own development and launch of iOS mobile app using CapacitorJS'
        ],
        achievements: [
          'Implemented reporting/blocking system to ensure safe community environment',
          'Added video upload functionality to community feed',
          'Implemented continuous updates for non-native code in mobile app',
          'Automated mobile build process using GitHub Actions and Fastlane',
          'Upgraded Angular from 12 to 16 and NX monorepo management tool'
        ],
        technologies: ['Angular', 'CapacitorJS', 'GitHub Actions', 'Fastlane', 'NX', 'iOS']
      },
      {
        title: 'Junior Full Stack Engineer',
        duration: 'July 2022 - October 2022',
        responsibilities: [
          'Member of Acquisition Squad bridging R&D department and marketing team',
          'Contribute to development and improvement of critical features',
          'Develop sign-up funnels, landing page, and public job search functionalities',
          'Integrate Google Ads to enhance marketing efforts'
        ],
        achievements: [
          'Developed public job search page to streamline user experience',
          'Integrated Google Ads to fully embrace product marketing efforts',
          'Conducted frontend refactoring on various components/pages',
          'Actively participated in ideation and estimation meetings'
        ],
        technologies: ['Angular', 'Google Ads', 'Frontend Architecture']
      }
    ]
  },
  {
    company: 'APOLLO | CODING LIFE',
    location: 'Lyon, Auvergne-Rhône-Alpes, France',
    duration: '2020 - 2022',
    description: 'Apollo is a Lyon-based IT consulting company specializing in both customer support services and custom software development from scratch. The company operates through an R&D department focused on full-cycle project development and continuous maintenance services.',
    roles: [
      {
        title: 'Software Engineer',
        duration: 'September 2021 - June 2022',
        responsibilities: [
          'Engage in full-stack software development across various projects',
          'Translate business needs into robust software solutions',
          'Contribute to projects in healthcare, energy, and enterprise resource sectors',
          'Work in dynamic, multi-disciplinary environment'
        ],
        achievements: [
          'Engineered internal communication platform with role-based access integrating Microsoft Graph API',
          'Contributed to health insurance platform redesign (MAGE), upgrading from Angular 6 to 13 and .NET Core 3.1 to 6.0',
          'Developed SelectClim application for AC system selection with automated quote generation',
          'Conducted system enhancements and integration into REXEL marketplace'
        ],
        technologies: ['React', '.NET 6', 'SQL Server', 'Azure', 'Docker', 'Angular 13', 'Cucumber.js']
      },
      {
        title: 'Software Engineer Intern',
        duration: 'June 2020 - August 2020',
        responsibilities: [
          'Participate in ground-up redesign of back-office application',
          'Manage catalog of courses pivotal for WordPress site integration',
          'Co-develop initial modules for course and module management',
          'Engage in requirement discussions and database design'
        ],
        achievements: [
          'Co-developed initial modules using Angular 10 and .NET Core 3.1',
          'Contributed to database design and feature development',
          'Operated within SCRUM framework with team collaboration',
          'Enhanced teamwork and project delivery'
        ],
        technologies: ['Angular 10', '.NET Core 3.1', 'Microsoft SQL Server', 'NGRX']
      }
    ]
  }
];
