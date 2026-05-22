# Documentation Guidelines

## Philosophy

Docs live alongside the code. Each tool or topic gets its own section.
The goal is not to replicate official documentation — it's to cover:

- Why we made certain choices
- How the tool is used specifically in this repo
- Known gotchas and debugging tips
- Onboarding and adoption guidance

## Structure

docs/
<topic>/
.nav.yml # Section title and display ordering
01-overview.md
02-<subtopic>.md
...

Files are prefixed with a 2-digit number (01, 02...) to control ordering.
The .nav.yml sets the section title shown in navigation.

## Writing a Doc

Each doc should where relevant:

- Reference actual code paths in the repo (e.g. `infrastructure/helm/`)
- Link to official documentation rather than replicating it
- Include a Mermaid diagram if it makes a flow clearer

### Mermaid Diagrams

Use diagrams when a flow is hard to follow as prose.
Keep them small and readable — max ~6-8 nodes, avoid wide layouts.
A diagram with too many elements is harder to read than no diagram at all.

### Avoid Over-Specific Details

Do not hard-code specifics that can be found in the repository itself:

- **No version numbers** — exact versions live in `Chart.yaml`, `values.yaml`, `package.json`, etc.
- **No counts** — number of replicas, nodes, or workers changes; the code is the source of truth
- **No exact CIDRs or IPs** — infrastructure details belong in Terraform configs, not docs
- **No public hostnames** — `argocd.kbntx.com`, `grafana.kbntx.com`, `vault.kbntx.com`, etc. should not appear in prose. Refer to services by name ("the ArgoCD UI", "the Grafana dashboard") and link to the Ingress template that owns the hostname. In code samples, use placeholders (`my-app.example.com`) or environment variables (`${{ vars.ARGOCD_SERVER }}`)

These details age badly and create maintenance burden. Link to the relevant file instead.

### Code References

Prefer linking to actual files over copy-pasting content:

- Helps readers navigate to the real implementation
- Stays accurate as the code evolves

### External Tech Links — Inline, Not in a List

When a tool, library, or service is mentioned in the prose, **inline-link
its official docs on first mention** (e.g.
`[ArgoCD](https://argo-cd.readthedocs.io/)`). Do not collect those links
into an "External" section at the bottom — a long bullet list of
unannotated tool docs is noise, and inline links read better in context.

### External Links Open in a New Tab

Any link that does **not** navigate to another page of this doc site
(i.e. anything outside `docs/src/`, including GitHub repo links and
external tech docs) must open in a new tab. Use the `attr_list` syntax
mkdocs Material already supports:

```markdown
[ArgoCD](https://argo-cd.readthedocs.io/){ target="\_blank" rel="noopener" }
[`Tiltfile`](https://github.com/kbntx-org/nexus/blob/main/Tiltfile){ target="\_blank" rel="noopener" }
```

Internal doc-to-doc links (e.g. `[Local development](02-local-development.md)`)
stay plain — keeping the reader inside the docs is the desired behavior
there.

### References Section

**Every doc ends with a `## References` section.** It contains
**repo-internal links only** — files, folders, charts, workflows, or
values files in `https://github.com/kbntx-org/nexus/...` that a reader might
want to open after finishing the doc. Each entry is one bullet with a
short trailing description.

External tech docs do not belong here — they go inline in the prose (see
above).

## What a Good Doc Covers

1. What the tool is and why we use it (brief, not a full tutorial)
2. How it fits into this repo specifically
3. Our conventions and decisions around it
4. Common debugging steps or known issues
5. A `## References` section with repo-internal links
