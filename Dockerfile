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

# Ensure cache and uploads directories are writable
RUN mkdir -p .next/cache public/uploads \
    && chown -R nextjs:nodejs .next public/uploads

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
