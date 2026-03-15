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

These details age badly and create maintenance burden. Link to the relevant file instead.

### Code References

Prefer linking to actual files over copy-pasting content:

- Helps readers navigate to the real implementation
- Stays accurate as the code evolves

## What a Good Doc Covers

1. What the tool is and why we use it (brief, not a full tutorial)
2. How it fits into this repo specifically
3. Our conventions and decisions around it
4. Common debugging steps or known issues
5. References: internal code paths + official docs
