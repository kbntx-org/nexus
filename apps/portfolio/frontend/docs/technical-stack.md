# Technical Stack

## Core Framework

### Angular 20

- **Version**: 20.1.4
- **Why Angular**:
  - Enterprise-grade framework with strong typing and tooling
  - Excellent for building maintainable, scalable applications
  - Built-in dependency injection and component architecture
  - Strong ecosystem and long-term support

### TypeScript

- **Version**: 5.8.3
- **Why TypeScript**:
  - Type safety reduces runtime errors
  - Better IDE support and developer experience
  - Easier refactoring and code maintenance
  - Industry standard for Angular applications

## Styling

### Tailwind CSS 3.4

- **Why Tailwind**:
  - Utility-first approach for rapid UI development
  - Consistent design system with customizable theme
  - Small production bundle size with purging
  - Excellent dark mode support with `class` strategy
  - Custom animations and keyframes for enhanced UX

### SCSS

- Used for global styles and component-specific styling
- CSS custom properties (variables) for theming
- Modular approach with component-scoped styles

## Icons & UI Components

### Lucide Angular

- **Version**: ^0.544.0
- Modern, customizable icon library
- Tree-shakeable for optimal bundle size
- Consistent icon style across the application

## State Management & Data

### RxJS

- **Version**: ~7.8.0
- Reactive programming for handling async operations
- Built-in Angular integration
- Observable patterns for data streams

## Build & Development Tools

### Nx Monorepo

- Monorepo management and build orchestration
- Dependency graph visualization
- Caching for faster builds
- Code generation and scaffolding

### Angular DevKit

- Build tools and development server
- Hot module replacement for fast development
- Production optimizations (AOT compilation, tree-shaking)

## Testing

### Jest

- **Version**: 30.0.5
- Fast, modern testing framework
- Snapshot testing support
- Excellent TypeScript support

### Jest Preset Angular

- Angular-specific Jest configuration
- Component testing utilities
- Template compilation support

## Code Quality

### ESLint

- **Version**: 9.32.0
- Code linting and quality enforcement
- Angular-specific rules via `@angular-eslint`
- Consistent code style across the project

### Prettier

- **Version**: ^3.6.2
- Code formatting
- Tailwind CSS plugin for class sorting

## Deployment

### Caddy

- **Version**: 2.10.2-alpine
- Modern, automatic HTTPS web server
- Simple configuration
- Built-in reverse proxy capabilities
- Efficient static file serving with smart caching

### Docker

- Containerized deployment
- Multi-stage builds for optimization
- Consistent environments across dev/staging/prod

## Runtime

### Zone.js

- **Version**: 0.15.1
- Angular's change detection mechanism
- Automatic change detection triggers
- Performance optimizations
