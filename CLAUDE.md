# CLAUDE.md — Nexus Monorepo

Global coding conventions for this repository. More specific rules live in
`CLAUDE.md` files within each project sub-directory.

---

## Naming Conventions

### No abbreviations or acronyms in identifiers

Use full, descriptive names. Never shorten service or library names to
initials.

**Bad:**

```go
cfSvc := cloudflare.NewService(...)  // "cf" for Cloudflare
k8sSvc := k8ssvc.NewService(...)     // "k8s" abbreviation as a variable name
cfg := rest.InClusterConfig()        // "cfg" for config
rl, _ := resourcelock.New(...)       // "rl" for resourceLock
```

**Good:**

```go
cloudflareService := cloudflare.NewService(...)
kubernetesService := k8ssvc.NewService(...)
kubeConfig := rest.InClusterConfig()
resourceLock, _ := resourcelock.New(...)
```

This rule applies to **all languages** in the repo.

### No single-letter variables

Avoid single-letter variable names outside of established conventions.

**Allowed exceptions (Go):**

- Receiver names: `s *service`, `h *handler` (short, consistent per type)
- Loop indices in `sort.Slice`: `i`, `j`
- Error shadow in short blocks: `err`
- Context: `ctx`

**Bad:**

```go
for _, r := range rules { ... }    // use "rule"
for h := range desired { ... }     // use "hostname"
for _, s := range items { ... }    // use descriptive name
```

### No magic numbers or magic strings

Extract any literal that encodes a domain concept into a named constant.

**Bad:**

```go
time.After(5 * time.Second)
IngressRule{Service: "http_status:404"}
```

**Good:**

```go
const watchReconnectDelay = 5 * time.Second
const catchAllRule = "http_status:404"
```

---

## Go-Specific Conventions

### Exported vs unexported identifiers

Follow standard Go visibility rules:

| Scope                            | Casing                     | Example                     |
| -------------------------------- | -------------------------- | --------------------------- |
| Exported type / function / const | `PascalCase`               | `NewService`, `IngressRule` |
| Unexported type / function / var | `camelCase`                | `cloudflareError`, `toSet`  |
| Receiver name                    | short abbreviation of type | `s *service`, `h *handler`  |
| Interface method                 | `PascalCase`               | `GetConfig`, `PutConfig`    |

### Interfaces belong near the consumer

Define interfaces in the package that **uses** them, not the package that
implements them. This keeps packages loosely coupled.

### Errors

Wrap errors with `%w` to preserve the chain:

```go
return fmt.Errorf("list ingresses: %w", err)
```

Do not swallow errors silently; always propagate or log with context.

---

## Documentation

All documentation lives in the [`docs/`](docs/) folder and must be kept in
sync with code changes. When adding, changing, or removing a feature:

- Update or create the relevant doc in `docs/`.
- Follow the structure and writing guidelines in [`docs/CLAUDE.md`](docs/CLAUDE.md).

Do not leave documentation stale — a doc that contradicts the code is worse
than no doc.

---

## Package Management

This repo uses **pnpm**. When adding or updating a dependency in any
`package.json`, always regenerate the lockfile:

```sh
pnpm i --no-frozen-lockfile
```

Never commit a `package.json` change without a matching `pnpm-lock.yaml` update.

---

## Helm Chart Values

Whenever a new configurable option is added to a Helm chart template, always add it with its production default to `values.yaml` as well. `values.local.yaml` only needs to contain overrides from that default.

This keeps `values.yaml` the single source of truth for all supported options.

---

## Tiltfile Rules

In Tilt `live_update` blocks, **all `sync` steps must come before all `run` steps**. Mixing the order causes a Tiltfile error.

```python
# Correct order
live_update=[
  sync('apps/portfolio/package.json', '/usr/src/app/apps/portfolio/package.json'),
  sync('apps/portfolio/src', '/usr/src/app/apps/portfolio/src'),
  run('pnpm install --no-frozen-lockfile', trigger=['apps/portfolio/package.json']),
]
```

---

## Keeping CLAUDE.md Up to Date

Whenever a new convention is established, a correction is given, or a useful
pattern emerges during a conversation, update the relevant `CLAUDE.md`
immediately:

- If the rule is global (applies across the whole repo) → update this file.
- If it is specific to one project → update or create that project's `CLAUDE.md`.

If you are not sure about it, ask me.

---

## Project-Specific CLAUDE.md Files

Each project may have its own `CLAUDE.md` with additional rules:

- [`docs/CLAUDE.md`](docs/CLAUDE.md) — Documentation writing guidelines
