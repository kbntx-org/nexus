FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY nx.json tsconfig.base.json ./
COPY platform/cloudflare-ingress-controller platform/cloudflare-ingress-controller

RUN pnpm exec nx build cloudflare-ingress-controller --configuration=production

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist/platform/cloudflare-ingress-controller/main.js ./main.js
CMD ["node", "main.js"]
