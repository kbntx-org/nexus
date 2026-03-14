#!/usr/bin/env bash
set -euo pipefail

DOCS_ROOT="/workspace"

exec mkdocs serve -f "$DOCS_ROOT/mkdocs.yml" -a 0.0.0.0:8000 --verbose
