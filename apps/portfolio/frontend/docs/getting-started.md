# Getting Started

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18 or higher
- **pnpm**: Fast, disk space efficient package manager
- **Docker** (optional): For containerized development and deployment

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/kbntx/nexus.git
cd nexus
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all dependencies for the entire monorepo, including the Portfolio Frontend.

## Development

### Start Development Server

```bash
pnpm nx serve portfolio-frontend
```

The application will be available at `http://localhost:4200`

### Development Server Options

- **Host**: By default, the server binds to `0.0.0.0`, making it accessible on your local network
- **Port**: Default port is 4200 (configurable)
- **Hot Reload**: Changes are automatically reflected in the browser
- **Source Maps**: Enabled for debugging

### Build for Production

```bash
pnpm nx build portfolio-frontend --configuration=production
```

The production build will be output to `dist/apps/portfolio/frontend/browser/`

### Build Options

- **AOT Compilation**: Ahead-of-time compilation for better performance
- **Optimization**: Minification, tree-shaking, and dead code elimination
- **Source Maps**: Disabled in production for smaller bundle size
- **Asset Optimization**: Images and fonts are optimized

## Running Tests

### Unit Tests

```bash
pnpm nx test portfolio-frontend
```

### Test Coverage

```bash
pnpm nx test portfolio-frontend --coverage
```

Coverage reports will be generated in `coverage/apps/portfolio/frontend/`

## Linting

### Run ESLint

```bash
pnpm nx lint portfolio-frontend
```

### Auto-fix Issues

```bash
pnpm nx lint portfolio-frontend --fix
```

## Docker Development

### Build Docker Image

```bash
docker build -t portfolio-frontend -f apps/portfolio/frontend/Dockerfile .
```

### Run Container

```bash
docker run -p 8080:80 portfolio-frontend
```

The application will be available at `http://localhost:8080`

### Using Docker Compose

```bash
docker-compose up portfolio-frontend
```

## Project Structure Overview

```
apps/portfolio/frontend/
├── src/
│   ├── app/                    # Application code
│   │   ├── pages/              # Page components
│   │   ├── shared/             # Shared components and services
│   │   ├── app.component.ts    # Root component
│   │   ├── app.config.ts       # App configuration
│   │   └── app.routes.ts       # Route definitions
│   ├── assets/                 # Static assets
│   └── styles.scss             # Global styles
├── Caddyfile                   # Web server config
├── Dockerfile                  # Docker build config
└── tailwind.config.js          # Tailwind configuration
```

## Common Tasks

### Adding a New Page

1. Create component in `src/app/pages/`
2. Add route in `src/app/app.routes.ts`
3. Add navigation link in `src/app/shared/components/navigation/`

### Adding a New Skill

1. Update `src/app/pages/home/data/skills.data.ts`
2. Add icon from Lucide Angular if needed
3. Skills will automatically appear on the home page

### Updating Theme Colors

1. Modify CSS variables in `src/styles.scss`
2. Update Tailwind theme in `tailwind.config.js` if needed
3. Changes apply to both light and dark modes

### Adding a New Project

1. Update `src/app/pages/projects/data/projects.data.ts`
2. Add project images to `src/assets/images/` if needed
3. Project will appear in the projects page

## Troubleshooting

### Port Already in Use

If port 4200 is already in use:

```bash
pnpm nx serve portfolio-frontend --port 4201
```

### Build Errors

1. Clear node_modules and reinstall:

   ```bash
   rm -rf node_modules
   pnpm install
   ```

2. Clear Nx cache:
   ```bash
   pnpm nx reset
   ```

### Docker Build Issues

1. Ensure Docker is running
2. Check Dockerfile syntax
3. Verify all paths in Dockerfile are correct

### Styling Issues

1. Ensure Tailwind is properly configured
2. Check that classes are not purged (add to `safelist` in `tailwind.config.js`)
3. Verify CSS variables are defined in `styles.scss`

## Next Steps

- Read the [Architecture](./architecture.md) documentation
- Learn about [Technical Choices](./technical-choices.md)
- Review the [Technical Stack](./technical-stack.md)
- Check [Deployment](./deployment.md) guide
