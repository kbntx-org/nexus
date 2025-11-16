# Architecture

## Project Structure

```
apps/portfolio/frontend/
├── src/
│   ├── app/
│   │   ├── pages/              # Page components
│   │   │   ├── home/           # Landing page
│   │   │   ├── experiences/    # Work experience timeline
│   │   │   ├── projects/       # Project showcase
│   │   │   └── cv/             # Resume display
│   │   ├── shared/             # Shared components and utilities
│   │   │   ├── components/     # Reusable components
│   │   │   ├── services/       # Shared services
│   │   │   └── pipes/          # Custom pipes
│   │   ├── app.component.ts    # Root component
│   │   ├── app.config.ts       # Application configuration
│   │   └── app.routes.ts       # Route definitions
│   ├── assets/                 # Static assets
│   │   ├── images/             # Image files
│   │   └── pdfs/               # PDF documents
│   ├── styles.scss             # Global styles
│   └── index.html              # HTML entry point
├── Caddyfile                   # Caddy web server configuration
├── Dockerfile                  # Docker build configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── project.json                # Nx project configuration
```

## Component Architecture

### Page Components
Each page is a standalone component with its own:
- **Component Logic**: TypeScript class with component logic
- **Template**: HTML template with Angular directives
- **Data**: TypeScript data files for content
- **Styling**: Component-scoped or global styles

### Shared Components
Reusable components used across multiple pages:
- **Navigation**: Main navigation bar with routing
- **Theme Toggle**: Dark/light mode switcher
- **Project Modal**: Modal dialog for project details

### Services
Shared business logic and state management:
- **Theme Service**: Manages dark/light mode state
  - System preference detection
  - Manual toggle functionality
  - Persistent storage (localStorage)

## Routing

### Route Structure
```
/ → redirects to /home
/home → HomeComponent (landing page)
/experiences → ExperiencesComponent (work experience)
/projects → ProjectsComponent (project showcase)
/cv → CvComponent (resume display)
```

### Routing Strategy
- **Client-Side Routing**: All routes handled by Angular Router
- **Hash-Free URLs**: Clean URLs without hash fragments
- **SPA Behavior**: No page reloads, smooth transitions
- **404 Handling**: Caddy configured to serve `index.html` for all routes

## Data Management

### Data-Driven Approach
Content is stored in TypeScript data files:
- **Type Safety**: Interfaces define data structure
- **Easy Updates**: Modify data files to update content
- **No Backend Required**: Static data for portfolio content

### Data Files
- `home.data.ts`: Home page content and skills
- `skills.data.ts`: Skills definitions with icons and colors
- `experiences.data.ts`: Work experience entries
- `projects.data.ts`: Project information and details

## Styling Architecture

### Tailwind CSS
- **Utility-First**: Styles applied via utility classes
- **Custom Theme**: Extended colors, animations, and spacing
- **Dark Mode**: Class-based dark mode with CSS variables
- **Responsive**: Mobile-first responsive design

### SCSS
- **Global Styles**: Base styles and CSS variables
- **Component Styles**: Scoped styles when needed
- **Theme Variables**: HSL color system for theming

## State Management

### Theme State
- **Service-Based**: ThemeService manages theme state
- **Reactive**: RxJS observables for state changes
- **Persistent**: localStorage for theme preference
- **System Integration**: Detects system preference on load

### Component State
- **Local State**: Component properties for local state
- **Input/Output**: Parent-child communication
- **No Global State Library**: Simple state management for portfolio needs

## Build & Deployment

### Build Process
1. **TypeScript Compilation**: AOT compilation for production
2. **Asset Processing**: Images, fonts, and other assets
3. **CSS Processing**: Tailwind purging and SCSS compilation
4. **Optimization**: Minification, tree-shaking, code splitting
5. **Output**: Static files in `dist/apps/portfolio/frontend/browser`

### Docker Build
- **Multi-stage**: Build in Node.js, serve with Caddy
- **Alpine Base**: Minimal image size
- **Static Files**: Only production build copied to final image
- **Caddy Configuration**: Caddyfile for routing and caching

### Caddy Configuration
- **Static File Serving**: Serves built Angular application
- **SPA Routing**: All routes serve `index.html`
- **Caching Strategy**: 
  - Long cache for assets (JS, CSS, images)
  - No cache for HTML
  - Special handling for CV images

## Performance Optimizations

### Bundle Size
- **Tree-Shaking**: Unused code eliminated
- **Code Splitting**: Route-based lazy loading ready
- **Asset Optimization**: Images optimized and compressed

### Caching
- **Asset Caching**: Long-term caching for static assets
- **HTML Caching**: No cache for HTML to ensure updates
- **Cache Headers**: Proper cache-control headers via Caddy

### Loading Performance
- **AOT Compilation**: Faster initial load
- **Minification**: Smaller bundle sizes
- **Gzip/Brotli**: Compression via Caddy

## Accessibility

### Semantic HTML
- **Proper Elements**: Use of semantic HTML elements
- **ARIA Labels**: Accessibility attributes where needed
- **Keyboard Navigation**: Full keyboard support

### Responsive Design
- **Mobile-First**: Designed for mobile, enhanced for desktop
- **Flexible Layouts**: CSS Grid and Flexbox for responsive layouts
- **Touch-Friendly**: Appropriate touch targets for mobile

## Security

### Content Security
- **No External Scripts**: All scripts are bundled
- **HTTPS Ready**: Caddy supports automatic HTTPS
- **Safe Routing**: Client-side routing with proper validation

### Build Security
- **Dependency Scanning**: Regular dependency updates
- **No Eval**: No use of `eval()` or similar unsafe patterns
- **Type Safety**: TypeScript prevents many security issues


