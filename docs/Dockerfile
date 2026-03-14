FROM squidfunk/mkdocs-material:9.6.20 AS builder

RUN apk add --no-cache bash rsync
RUN pip install mkdocs-awesome-nav

WORKDIR /workspace

# Copy entire repo (build context should be repo root)
COPY . /workspace

# Sync docs to /docs structure
RUN rm -rf /docs/* && \
    mkdir -p /docs && \
    if [ -d /workspace/apps/documentation/docs ]; then \
        rsync -a /workspace/apps/documentation/docs/ /docs/; \
    fi && \
    find /workspace -type d -name docs 2>/dev/null | grep -Ev "node_modules|dist|\.git|__pycache__|build|\.next|tmp|coverage" | \
    while read -r docs_path; do \
        rel_path="${docs_path#/workspace/}"; \
        if [ "$rel_path" != "apps/documentation/docs" ]; then \
            target_dir="${rel_path%/docs}"; \
            dest_path="/docs/documentation/$target_dir"; \
            mkdir -p "$dest_path"; \
            rsync -a "$docs_path"/ "$dest_path"/; \
        fi; \
    done && \
    cp /workspace/mkdocs.yml /mkdocs.yml && \
    if [ -f /workspace/README.md ]; then \
        cp /workspace/README.md /docs/README.md; \
    fi

WORKDIR /
RUN mkdocs build --verbose

FROM caddy:2.10.2-alpine

COPY apps/documentation/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /site /srv/app/

