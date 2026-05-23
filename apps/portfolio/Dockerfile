FROM node:24.16.0-alpine AS local

RUN npm install -g pnpm@11.2.2

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY nx.json tsconfig.base.json ./
COPY apps/portfolio ./apps/portfolio

EXPOSE 4200

CMD ["pnpm", "nx", "run", "portfolio:serve", "--host=0.0.0.0", "--poll=2000"]

FROM caddy:2.11.2-alpine AS prod

COPY dist/apps/portfolio/browser /srv/app/
COPY apps/portfolio/Caddyfile /etc/caddy/Caddyfile
