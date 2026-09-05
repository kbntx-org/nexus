ARG NODE_VERSION
ARG PNPM_VERSION

FROM node:${NODE_VERSION}-alpine AS node-tooling

ARG PNPM_VERSION

ENV PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN=false
ENV PNPM_CONFIG_TRUST_LOCKFILE=true

RUN npm install -g pnpm@${PNPM_VERSION}

FROM node-tooling AS portfolio-node-modules

WORKDIR /usr/src/app

COPY --parents **/package.json pnpm-workspace.yaml pnpm-lock.yaml .pnpmfile.mjs ./

RUN --mount=type=cache,id=pnpm-store-portfolio,target=/root/.pnpm-store \
    pnpm_config_store_dir=/root/.pnpm-store pnpm --filter portfolio deploy /pruned

FROM node-tooling AS local

WORKDIR /usr/src/app

COPY nx.json tsconfig.base.json ./
COPY apps/portfolio ./apps/portfolio
COPY --from=portfolio-node-modules /pruned/node_modules ./node_modules
COPY --from=portfolio-node-modules /pruned/package.json /pruned/pnpm-lock.yaml ./

EXPOSE 4200

CMD ["pnpm", "nx", "run", "portfolio:serve", "--host=0.0.0.0", "--poll=2000"]

FROM node-tooling AS builder

WORKDIR /usr/src/app

COPY nx.json tsconfig.base.json ./
COPY apps/portfolio ./apps/portfolio
COPY --from=portfolio-node-modules /pruned/node_modules ./node_modules
COPY --from=portfolio-node-modules /pruned/package.json /pruned/pnpm-lock.yaml ./

RUN pnpm nx build portfolio --configuration=production

FROM caddy:2.11.4-alpine AS prod

COPY --from=builder /usr/src/app/dist/apps/portfolio/browser /srv/app/
COPY apps/portfolio/Caddyfile /etc/caddy/Caddyfile
