ARG NODE_VERSION

FROM node:${NODE_VERSION}-alpine AS local

ARG PNPM_VERSION

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmfile.mjs ./
RUN npm install -g pnpm@${PNPM_VERSION}
RUN pnpm install --frozen-lockfile

COPY nx.json tsconfig.base.json ./
COPY apps/portfolio ./apps/portfolio

EXPOSE 4200

CMD ["pnpm", "nx", "run", "portfolio:serve", "--host=0.0.0.0", "--poll=2000"]

FROM caddy:2.11.4-alpine AS prod

COPY dist/apps/portfolio/browser /srv/app/
COPY apps/portfolio/Caddyfile /etc/caddy/Caddyfile
