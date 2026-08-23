# CLAUDE.md — Nexus Monorepo

Global coding conventions for this repository. More specific rules live in `CLAUDE.md` files within
each project sub-directory.

---

## Naming Conventions

### No abbreviations or acronyms in identifiers

Use full, descriptive names. Never shorten service or library names to initials.

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

Define interfaces in the package that **uses** them, not the package that implements them. This
keeps packages loosely coupled.

### Errors

Wrap errors with `%w` to preserve the chain:

```go
return fmt.Errorf("list ingresses: %w", err)
```

Do not swallow errors silently; always propagate or log with context.

---

## Documentation

All documentation lives in the [`docs/`](docs/) folder and must be kept in sync with code changes.
When adding, changing, or removing a feature:

- Update or create the relevant doc in `docs/`.
- Follow the structure and writing guidelines in [`docs/CLAUDE.md`](docs/CLAUDE.md).

Do not leave documentation stale — a doc that contradicts the code is worse than no doc.

---

## GitHub Actions Workflows

### Single entrypoint per trigger group, no `-pr`/`-main` file pairs

Don't duplicate a workflow into `-pr.yml`/`-main.yml` variants. Instead, trigger on both events from
one workflow and branch on `github.event_name` (or an explicit input passed down from the
entrypoint) wherever behavior needs to differ. This context reliably reflects the _original_
triggering event even inside a `workflow_call`-reusable workflow, including through nested reusable
workflow calls.

### Prefer parallel steps over a job-per-unit-of-work

GitHub Actions supports running steps concurrently within a single job (shipped 2026-06-25):
`background: true` on a step runs it async; `wait` / `wait-all` blocks until named/all background
steps finish; `cancel` terminates a background step; `parallel:` is sugar that wraps a list of steps
into background steps with an implicit `wait-all`. Composite actions (`uses:` a local
`./.github/actions/...`) can run as a background/parallel step, but a composite action cannot
declare `background` steps internally, and a `parallel:` group cannot be used inside a composite
action. Each entry in a `parallel:` list is exactly one step (one `run:` or `uses:`) — there is no
nested sequential sub-chain per lane, so independent multi-command lanes need either a single
consolidated `run:` script or to accept some serialization for steps that must precede the parallel
block. Prefer this over spinning up one job (one ARC runner pod) per independent unit of work when
the units are cheap enough to share a runner — e.g. [`build.yml`](.github/workflows/build.yml)
builds the portfolio and documentation images as parallel steps in one job instead of two separate
jobs.

### Composite actions over reusable workflows for single-consumer step sequences

If a `workflow_call` reusable workflow has exactly one caller, prefer converting it to a composite
action (`.github/actions/<name>/action.yaml`) instead. A reusable workflow always gets its own job
(its own ARC runner pod); a composite action's steps run inline in the caller's job, so invoking it
is just one more step. See [`compute-affected`](.github/actions/compute-affected/action.yaml),
inlined as a step in [`build.yml`](.github/workflows/build.yml) rather than a separate `affected`
job. Two gotchas when doing this conversion:

- Composite actions have **no implicit access to the `secrets` context** (no `secrets: inherit`
  equivalent). Any secret the action's steps need must be declared as an explicit `inputs:` entry
  and passed via `with:` at the call site — referencing `${{ secrets.X }}` directly inside the
  action silently resolves to empty.
- Composite action `run:` steps need an explicit `shell:` on every step (no job-level
  `defaults: run: shell:` to inherit from).

### Self-invalidating fail-safe on pipeline-critical files

[`compute-affected`](.github/actions/compute-affected/action.yaml) marks every application as a
deploy target if any file in its own hardcoded `pipelineCriticalFiles` list changed (currently: the
action itself, `build.yml`, `deploy.yml`). When a workflow file takes over responsibility for
build/deploy correctness in a way that other pipeline logic depends on, add it to that list — the
assumption is that a change to pipeline-critical logic is risky enough to warrant a full re-deploy
rather than trusting incremental affected-detection.

---

## Package Management

This repo uses **pnpm**. When adding or updating a dependency in any `package.json`, always
regenerate the lockfile:

```sh
pnpm i --no-frozen-lockfile
```

Never commit a `package.json` change without a matching `pnpm-lock.yaml` update.

---

## Helm Chart Values

Whenever a new configurable option is added to a Helm chart template, always add it with its
production default to `values.yaml` as well. `values.local.yaml` only needs to contain overrides
from that default.

This keeps `values.yaml` the single source of truth for all supported options.

---

## Tiltfile Rules

In Tilt `live_update` blocks, **all `sync` steps must come before all `run` steps**. Mixing the
order causes a Tiltfile error.

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

Whenever a new convention is established, a correction is given, or a useful pattern emerges during
a conversation, update the relevant `CLAUDE.md` immediately:

- If the rule is global (applies across the whole repo) → update this file.
- If it is specific to one project → update or create that project's `CLAUDE.md`.

If you are not sure about it, ask me.

---

## Project-Specific CLAUDE.md Files

Each project may have its own `CLAUDE.md` with additional rules:

- [`docs/CLAUDE.md`](docs/CLAUDE.md) — Documentation writing guidelines
