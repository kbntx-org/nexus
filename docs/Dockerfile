FROM squidfunk/mkdocs-material:9.6.20 AS builder

RUN apk add --no-cache bash rsync
RUN pip install mkdocs-awesome-nav mkdocs-glightbox

FROM builder AS docs

COPY mkdocs.yml /mkdocs.yml
COPY ./src /docs

WORKDIR /

RUN mkdocs build

FROM caddy:2.10.2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=docs /site /srv/app/
