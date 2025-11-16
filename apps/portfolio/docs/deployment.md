# Deployment

## Overview

The Portfolio Frontend is containerized using Docker and served with Caddy, a modern web server with automatic HTTPS support. The deployment process is optimized for production with proper caching strategies and performance optimizations.

## Build Process

### Local Build

```bash
# Build for production
pnpm nx build portfolio-frontend --configuration=production

# Output location
dist/apps/portfolio/frontend/browser/
```

### Docker Build

```bash
# Build Docker image
docker build -t portfolio-frontend -f apps/portfolio/frontend/Dockerfile .

# Or using Docker Compose
docker-compose build portfolio-frontend
```

## Docker Image

### Multi-Stage Build

The Dockerfile uses a multi-stage build:

1. **Build Stage**: Uses Node.js to build the Angular application
2. **Production Stage**: Uses Caddy Alpine image to serve static files

### Image Layers

- **Base**: `caddy:2.10.2-alpine` (minimal Alpine Linux)
- **Application**: Built Angular application
- **Configuration**: Caddyfile for routing and caching

### Image Size

- **Optimized**: Only production files included
- **Alpine Base**: Minimal base image (~40MB)
- **Final Size**: Typically under 50MB

## Caddy Configuration

### Static File Serving

Caddy serves the built Angular application from `/srv/app/`

### SPA Routing

All routes are configured to serve `index.html` to support client-side routing:

```caddyfile
route {
    try_files {path} /index.html
}
```

### Caching Strategy

#### Assets (JS, CSS, Images)

- **Cache-Control**: `public, max-age=31536000, immutable`
- **Long-term caching**: Assets are hashed, so safe to cache indefinitely

#### HTML

- **Cache-Control**: `no-store`
- **No caching**: Ensures users always get the latest HTML

#### JSON Files

- **Cache-Control**: `no-cache, must-revalidate`
- **Revalidation**: JSON files are revalidated on each request

#### CV Images

- **Cache-Control**: `no-store`
- **No caching**: CV images may be updated frequently

## Deployment Options

### Docker Compose

```yaml
services:
  portfolio-frontend:
    build:
      context: .
      dockerfile: apps/portfolio/frontend/Dockerfile
    ports:
      - '80:80'
    restart: unless-stopped
```

### Kubernetes

The project includes Helm charts in `apps/portfolio/frontend/chart/` for Kubernetes deployment.

#### Deploy to Kubernetes

```bash
# Install Helm chart
helm install portfolio ./apps/portfolio/frontend/chart

# Or using kubectl
kubectl apply -f apps/portfolio/frontend/chart/templates/
```

### Cloud Platforms

#### AWS (ECS/Fargate)

- Build and push to ECR
- Deploy as ECS service or Fargate task
- Use Application Load Balancer for HTTPS

#### Google Cloud (Cloud Run)

- Build and push to Container Registry
- Deploy to Cloud Run
- Automatic HTTPS and scaling

#### Azure (Container Instances)

- Build and push to Container Registry
- Deploy to Container Instances
- Use Application Gateway for HTTPS

### Traditional Hosting

#### VPS/Server

1. Build the application locally or on CI/CD
2. Copy `dist/apps/portfolio/frontend/browser/` to server
3. Configure Nginx/Caddy to serve the files
4. Set up SSL certificate (Let's Encrypt)

## Environment Variables

Currently, the application doesn't require environment variables as it's a static site. However, if you need to configure:

### Development

- No environment variables needed

### Production

- No environment variables needed
- All configuration is build-time

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Portfolio

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm nx build portfolio-frontend --configuration=production
      - name: Build Docker image
        run: docker build -t portfolio-frontend -f apps/portfolio/frontend/Dockerfile .
      - name: Deploy
        run: |
          # Your deployment commands here
```

### GitLab CI Example

```yaml
build:
  stage: build
  script:
    - pnpm install
    - pnpm nx build portfolio-frontend --configuration=production
    - docker build -t portfolio-frontend -f apps/portfolio/frontend/Dockerfile .
  artifacts:
    paths:
      - dist/apps/portfolio/frontend/browser/
```

## Performance Optimization

### Build Optimizations

- **AOT Compilation**: Ahead-of-time compilation for faster runtime
- **Tree-Shaking**: Unused code eliminated
- **Minification**: JavaScript and CSS minified
- **Asset Optimization**: Images optimized during build

### Runtime Optimizations

- **Caching**: Proper cache headers for assets
- **Compression**: Gzip/Brotli compression via Caddy
- **HTTP/2**: Enabled by default in Caddy
- **CDN Ready**: Can be deployed behind a CDN

## Monitoring

### Health Checks

Caddy provides a health endpoint at `/.well-known/health` (if configured)

### Logging

Caddy logs are available via Docker logs:

```bash
docker logs portfolio-frontend
```

### Metrics

Consider adding:

- Application performance monitoring (APM)
- Error tracking (Sentry, etc.)
- Analytics (Google Analytics, Plausible, etc.)

## Security

### HTTPS

Caddy automatically handles HTTPS with Let's Encrypt:

```caddyfile
yourdomain.com {
    # Automatic HTTPS
}
```

### Security Headers

Add security headers in Caddyfile:

```caddyfile
header {
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    X-XSS-Protection "1; mode=block"
    Referrer-Policy "strict-origin-when-cross-origin"
}
```

### Content Security Policy

Configure CSP headers for additional security:

```caddyfile
header Content-Security-Policy "default-src 'self'"
```

## Rollback Strategy

### Docker Tags

Use version tags for easy rollback:

```bash
docker tag portfolio-frontend:latest portfolio-frontend:v1.0.0
```

### Kubernetes Rollback

```bash
kubectl rollout undo deployment/portfolio-frontend
```

## Troubleshooting

### Container Won't Start

1. Check Docker logs: `docker logs portfolio-frontend`
2. Verify Caddyfile syntax
3. Ensure port 80 is available

### 404 Errors on Routes

1. Verify Caddyfile has SPA routing configured
2. Check that `try_files` directive is present
3. Ensure `index.html` is in the correct location

### Assets Not Loading

1. Check cache headers
2. Verify asset paths are correct
3. Clear browser cache

### Performance Issues

1. Check bundle size
2. Verify compression is enabled
3. Consider CDN for static assets
4. Review caching strategy
