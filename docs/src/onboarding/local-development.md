# Local development

## Core commands

```bash
pnpm install
pnpm nx format:check --all
pnpm nx run-many --target lint --all --parallel
pnpm nx test portfolio
```

## Documentation locally (hot reload)

From repository root:

```bash
docker compose -f docs/docker-compose.yml up --build
```

Then open <http://localhost:8000>.

## Typical workflow

1. Create a feature branch.
2. Make changes in a focused scope (app, chart, or platform component).
3. Run format and lint locally.
4. Open PR with operational impact notes (if any).
