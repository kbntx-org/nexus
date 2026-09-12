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

## Runtime Versions (mise)

The root [`mise.toml`](mise.toml) is the single source of truth for every language runtime version
in this repo (Node.js, pnpm, Go, ...) and for the minimum required `mise` CLI version
(`min_version`). The CI toolkit image
([`base-image/Dockerfile`](platform/core/github-arc-runners/base-image/Dockerfile)) only bakes in
generic, version-insensitive pipeline utilities that nearly every job needs regardless of which
project it's touching — `jq` and `git` via `apt`, `yq` copied from its upstream image, the Docker
CLI/Buildx/Compose plugins — plus the Docker/GH Actions runner scaffolding itself. It does **not**
bake in `mise` or any other `mise.toml`-tracked tool (Node.js, pnpm, Go, the GitHub CLI,
golangci-lint, s5cmd, ...) — it's deliberately agnostic to this repo's state otherwise. Every
pipeline resolves those on demand via the [`mise-install`](.github/actions/mise-install/action.yaml)
composite action, which installs `mise` itself first if the runner doesn't already have one (pinned
to a version hardcoded in the action, since bootstrapping `mise` can't itself depend on reading
`mise.toml` with `mise`), then runs `mise install <tools>` against the checkout's own `mise.toml`.
`yq` still has an entry in `mise.toml` too (for contributors' local dev environments), but CI
doesn't route it through mise since it's baked into the runner already — don't add `yq` to a
`mise-install` `tools:` list. Nothing else should hardcode or re-derive one of these versions:

- Don't add `engines` or `packageManager` fields to `package.json` — they'd duplicate `mise.toml`,
  and `packageManager` specifically triggers corepack's auto-install/enforcement behavior, which is
  unwanted here. `devEngines` is the one exception: it declares the supported Node.js version
  _range_ (currently `24.x`) as a soft (`onFail: warn`) compatibility check for contributors, not an
  exact pin — nothing reads it to resolve a version for CI, so it doesn't re-introduce the
  duplication `mise.toml` replaced. Same idea applies per-language elsewhere: a Go module's `go`
  directive in `go.mod` and a Python project's `requires-python` in `pyproject.toml` state the
  supported language-version range for that module/package, independent of `mise.toml` pinning the
  exact toolchain CI builds with.
- Don't hardcode a runtime version in a Dockerfile. Project Dockerfiles (`cloudflare-controller`,
  `kiln`, `portfolio`, ...) that pick an upstream base image tag
  (`FROM golang:${GO_VERSION}-alpine`, `FROM node:${NODE_VERSION}-alpine`) still take that version
  as a build `ARG`, resolved at the call site (the project's `build-ci` target) with
  `mise current <name>` — not `yq`; the CI runner's `mise-install` step already guarantees `mise` is
  on `PATH` by the time any `build-ci` target runs, and `mise current <name>` reads the pinned
  version straight out of `mise.toml` without needing the tool installed first. There's no base
  image to pick for a binary the Dockerfile installs directly, so that case installs `mise` instead
  and runs `mise install <name>` against its own copy of `mise.toml`. The one exception is
  `mise-install`'s own bootstrap `mise` version (see above), hardcoded on purpose since it can't
  depend on the very tool it's installing.
- Don't `jq`/`node -p`/etc. a version out of `package.json` — that pattern is exactly what
  `mise.toml` replaced.
- Repo-level command shortcuts (creating the local cluster, `tilt up` variants, etc.) are
  <a href="https://mise.jdx.dev/tasks/">mise tasks</a> in `mise.toml`'s `[tasks]`, not
  `package.json` `scripts` — `package.json` isn't even the right home for non-JS-workspace commands
  (Tilt/kind orchestration) once `mise.toml` is already the tool that installs and runs them. Run
  one with `mise run <name>` (or the bare `mise <name>` shorthand).

A GitHub Actions job that needs one or more `mise.toml`-tracked tools on `PATH` uses the
[`mise-install`](.github/actions/mise-install/action.yaml) composite action right after checkout,
listing exactly the tools that job's steps invoke — e.g. `tools: node pnpm` for a plain Nx job,
`tools: node pnpm go golangci-lint` for
[`lint-and-format.yml`](.github/workflows/lint-and-format.yml) since a Go project's `lint` target
shells out to both. Don't list every `mise.toml` tool "to be safe" — only what that job actually
runs, so jobs stay fast.

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
  sync('platform/services/kiln/server', '/workspace'),
  run('go build -o /tmp/kiln-bin ./cmd', trigger=['platform/services/kiln/server/go.mod']),
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
