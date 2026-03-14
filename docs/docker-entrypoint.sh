#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="/workspace"
DOCS_DEST="/docs"
IGNORED_PATHS="node_modules|dist|\.git|__pycache__|build|\.next|tmp|coverage"

copy_directory() {
    local source="$1"
    local destination="$2"

    mkdir -p "$destination"
    rsync -a "$source"/ "$destination"/
}

sync_docs() {
    echo "→ Syncing documentation..."

    rm -rf "$DOCS_DEST"/*
    mkdir -p "$DOCS_DEST"

    # docs/src → /docs (root)
    if [[ -d "$WORKSPACE/docs/src" ]]; then
        echo "→ Copying docs/src → $DOCS_DEST"
        copy_directory "$WORKSPACE/docs/src" "$DOCS_DEST"
    fi

    # All other docs folders → /docs/documentation/{path}
    find "$WORKSPACE" -type d -name docs \
        | grep -Ev "$IGNORED_PATHS" \
        | while read -r docs_path; do
            rel_path="${docs_path#$WORKSPACE/}"

            if [[ "$rel_path" == "docs" ]] || [[ "$rel_path" == "docs/src" ]]; then
                continue
            fi

            target_dir="${rel_path%/docs}"
            dest_path="$DOCS_DEST/documentation/$target_dir"
            echo "→ Copying $rel_path → $dest_path"
            copy_directory "$docs_path" "$dest_path"
        done

    if [[ -f "$WORKSPACE/docs/mkdocs.yml" ]]; then
        echo "→ Copying docs/mkdocs.yml → /mkdocs.yml"
        cp "$WORKSPACE/docs/mkdocs.yml" "/mkdocs.yml"
    fi

    if [[ -f "$WORKSPACE/README.md" ]]; then
        echo "→ Copying README.md → $DOCS_DEST/README.md"
        cp "$WORKSPACE/README.md" "$DOCS_DEST/README.md"
    fi

    echo "→ Sync complete."
    echo "→ Contents of $DOCS_DEST:"
    ls -la "$DOCS_DEST"
}

initial_sync() {
    echo "→ Initial sync..."
    sync_docs
}

initial_sync

if [[ "${1:-}" == "serve" ]]; then
    echo "→ Starting mkdocs serve with live sync…"
    (cd / && mkdocs serve -a 0.0.0.0:8000 --verbose) &
    MKDOCS_PID=$!

    echo "→ Watching $WORKSPACE for changes..."

    while change=$(inotifywait -r -e modify,create,delete,move "$WORKSPACE" \
        --exclude "$IGNORED_PATHS" 2>&1); do

        if echo "$change" | grep -qE "(docs|mkdocs\.yml|README\.md)"; then
            echo "→ Change detected: $change"
            echo "→ Resyncing…"
            sync_docs
        fi
    done

    trap "kill $MKDOCS_PID" SIGINT SIGTERM
    wait $MKDOCS_PID
else
    exec "$@"
fi
