FROM squidfunk/mkdocs-material:9.6.20 AS base

RUN pip install \
      mkdocs-awesome-nav \
      mkdocs-glightbox \
      mkdocs-minify-plugin

FROM base AS local

WORKDIR /workspace

COPY . /workspace/

EXPOSE 80

CMD ["serve", "-f", "/workspace/mkdocs.yml", "-a", "0.0.0.0:80"]

FROM base AS builder

RUN apk add --no-cache bash rsync

COPY mkdocs.yml /mkdocs.yml
COPY ./src /src

WORKDIR /

RUN mkdocs build

FROM caddy:2.11.2-alpine AS prod

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /site /srv/app/
