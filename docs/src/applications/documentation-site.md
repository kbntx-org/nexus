# Documentation site

## Repository location

- MkDocs config: `docs/mkdocs.yml`
- Content: `docs/src`
- Production image: `docs/Dockerfile`
- Local hot reload: `docs/docker-compose.yml`
- Helm chart: `docs/helm`

## Local run

```bash
docker compose -f docs/docker-compose.yml up --build
```
