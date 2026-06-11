ARG NODE_VERSION=24.13.0-slim

FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ARG POSTGRES_PRISMA_URL
ARG POSTGRES_URL_NON_POOLING
ENV POSTGRES_PRISMA_URL=$POSTGRES_PRISMA_URL
ENV POSTGRES_URL_NON_POOLING=$POSTGRES_URL_NON_POOLING
RUN npx prisma generate
RUN npm run build

FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/app/lib/database-url.ts ./app/lib/database-url.ts
RUN npm install prisma@7.8.0 dotenv

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY .env.example .env.example

RUN apt-get update -y && apt-get install -y openssl \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && chown -R nextjs:nodejs /app

USER nextjs
ENV HOME=/app
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
