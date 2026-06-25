FROM node:22-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm@9.15.9 && pnpm install --no-frozen-lockfile

# --- Build ---
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Stable Server Actions encryption key — должен быть одинаковым для всех билдов,
# иначе клиенты со старым бандлом получают "Failed to find Server Action" после деплоя.
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY

# Generate Prisma client and build
RUN npm install -g pnpm@9.15.9 && npx prisma generate && pnpm build

# --- Production ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma CLI + движки, чтобы применять миграции прямо из этого образа на сервере.
# Прод-сервер (РФ) не достаёт до registry.npmjs.org, поэтому ставить prisma на
# каждом деплое нельзя — ставим глобально на этапе сборки (раннер GitHub, сеть
# есть), движки запекаются в образ. dotenv нужен для prisma.config.ts.
RUN npm install -g prisma@7.5.0 dotenv
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Ensure cache and uploads directories are writable
RUN mkdir -p .next/cache public/uploads \
    && chown -R nextjs:nodejs .next public/uploads

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
