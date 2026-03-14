# Common tasks

## Validate repository formatting and lint

```bash
pnpm nx format:check --all
pnpm nx run-many --target lint --all --parallel
```

## Validate documentation build

```bash
python -m pip install mkdocs mkdocs-material mkdocs-awesome-nav mkdocs-glightbox
mkdocs build -f docs/mkdocs.yml
```

## Find stale moved-path references

```bash
rg -n "apps/documentation|old/path" .github platform docs apps
```
