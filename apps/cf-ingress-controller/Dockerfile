FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/cf-ingress-controller/package.json apps/cf-ingress-controller/

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY tsconfig.base.json nx.json ./
COPY apps/cf-ingress-controller/ apps/cf-ingress-controller/

RUN pnpm exec nx build cf-ingress-controller

FROM node:22-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist/apps/cf-ingress-controller ./dist
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production

CMD ["node", "dist/src/main.js"]
