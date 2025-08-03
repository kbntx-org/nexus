export interface Project {
  title: string;
  description: string;
  tech: string[];
  image: string;
  longDescription?: string;
  features?: string[];
  liveUrl?: string;
  githubUrl?: string;
  images?: string[];
}

export const PROJECTS: Project[] = [
  {
    title: 'E-Commerce Platform',
    description:
      'A full-stack e-commerce solution with React frontend and Node.js backend, featuring user authentication, payment processing, and admin dashboard.',
    tech: ['React', 'Node.js', 'MongoDB', 'Stripe'],
    image: 'assets/images/ecommerce.jpg',
    longDescription:
      'A comprehensive e-commerce platform built with modern web technologies. Features include user authentication, product catalog, shopping cart, payment processing with Stripe, order management, and an admin dashboard for inventory and sales tracking.',
    features: [
      'User authentication and authorization',
      'Product catalog with search and filtering',
      'Shopping cart and checkout process',
      'Payment processing with Stripe',
      'Order tracking and management',
      'Admin dashboard for inventory control'
    ],
    liveUrl: 'https://ecommerce-demo.com',
    githubUrl: 'https://github.com/username/ecommerce-platform'
  },
  {
    title: 'Task Management App',
    description:
      'A collaborative task management application with real-time updates, drag-and-drop functionality, and team collaboration features.',
    tech: ['Angular', 'Firebase', 'TypeScript', 'RxJS'],
    image: 'assets/images/task-manager.jpg',
    longDescription:
      'A real-time collaborative task management application that enables teams to organize, track, and complete projects efficiently. Features drag-and-drop functionality, real-time updates, and comprehensive team collaboration tools.',
    features: [
      'Real-time task updates and notifications',
      'Drag-and-drop task organization',
      'Team collaboration and sharing',
      'Project templates and workflows',
      'Progress tracking and analytics',
      'Mobile-responsive design'
    ],
    liveUrl: 'https://task-manager-demo.com',
    githubUrl: 'https://github.com/username/task-manager'
  },
  {
    title: 'Portfolio Website',
    description:
      'A modern, responsive portfolio website built with Angular and SCSS, featuring smooth animations and dark/light theme switching.',
    tech: ['Angular', 'SCSS', 'TypeScript', 'Nx'],
    image: 'assets/images/portfolio.jpg',
    longDescription:
      'A modern, responsive portfolio website showcasing professional work and skills. Built with Angular and SCSS, featuring smooth animations, dark/light theme switching, and optimized for performance and accessibility.',
    features: [
      'Responsive design for all devices',
      'Dark/light theme switching',
      'Smooth scroll animations',
      'Interactive project showcase',
      'Contact form integration',
      'SEO optimized'
    ],
    liveUrl: 'https://portfolio-demo.com',
    githubUrl: 'https://github.com/username/portfolio'
  },
  {
    title: 'Weather Dashboard',
    description:
      'A weather application that displays current conditions and forecasts using multiple weather APIs with interactive charts and maps.',
    tech: ['Vue.js', 'Chart.js', 'OpenWeather API', 'Vite'],
    image: 'assets/images/weather.jpg',
    longDescription:
      'A comprehensive weather dashboard that provides current conditions, detailed forecasts, and historical weather data. Features interactive charts, maps, and multiple weather API integrations for accurate data.',
    features: [
      'Current weather conditions',
      '7-day and hourly forecasts',
      'Interactive weather maps',
      'Historical weather data',
      'Multiple location support',
      'Weather alerts and notifications'
    ],
    liveUrl: 'https://weather-dashboard.com',
    githubUrl: 'https://github.com/username/weather-app'
  },
  {
    title: 'Social Media Analytics',
    description:
      'A dashboard for tracking social media metrics with data visualization, automated reporting, and trend analysis.',
    tech: ['React', 'D3.js', 'Python', 'PostgreSQL'],
    image: 'assets/images/analytics.jpg',
    longDescription:
      'A powerful social media analytics dashboard that provides comprehensive insights into social media performance. Features data visualization, automated reporting, trend analysis, and actionable recommendations.',
    features: [
      'Multi-platform social media integration',
      'Real-time data visualization',
      'Automated report generation',
      'Trend analysis and predictions',
      'Custom dashboard creation',
      'Export and sharing capabilities'
    ],
    liveUrl: 'https://analytics-dashboard.com',
    githubUrl: 'https://github.com/username/social-analytics'
  },
  {
    title: 'Mobile Fitness App',
    description:
      'A cross-platform mobile application for tracking workouts, nutrition, and fitness goals with progress visualization.',
    tech: ['React Native', 'Redux', 'Firebase', 'Expo'],
    image: 'assets/images/fitness.jpg',
    longDescription:
      'A comprehensive fitness tracking application that helps users monitor workouts, nutrition, and progress toward their fitness goals. Features cross-platform compatibility, progress visualization, and social features.',
    features: [
      'Workout tracking and planning',
      'Nutrition and calorie tracking',
      'Progress visualization and charts',
      'Social features and challenges',
      'Offline functionality',
      'Integration with fitness devices'
    ],
    liveUrl: 'https://fitness-app.com',
    githubUrl: 'https://github.com/username/fitness-app'
  }
];
