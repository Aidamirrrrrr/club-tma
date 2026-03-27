# Project Guidelines

## Architecture

Telegram Mini App для управления мероприятиями клуба. Fullstack Next.js 16 App Router.

- **Frontend**: React 19 client components, Telegram Mini App SDK (`@telegram-apps/sdk-react`)
- **Backend**: Next.js API routes (`src/app/api/`), Prisma 7 + PostgreSQL
- **Auth**: Telegram `initData` HMAC-SHA256 validation (server-side), no cookies/sessions
- **Styling**: TailwindCSS 4, shadcn/ui (Radix UI), `class-variance-authority`

### Key directories

| Path                 | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `src/app/api/`       | Server-side API routes                       |
| `src/app/(pages)/`   | Client-side page components (`"use client"`) |
| `src/components/ui/` | Reusable UI components (shadcn/ui style)     |
| `src/db/`            | Database schema and connection               |
| `src/lib/`           | Shared utilities, validation, auth helpers   |

### Data flow

1. Client reads auth state from `useTelegram()` hook (via `useSyncExternalStore`)
2. API calls include `x-telegram-init-data` header (or `x-user-id` in dev)
3. Server validates initData via `requireAuth()` / `requireAdmin()` before any DB access
4. DB queries use Prisma ORM (parameterized, no raw SQL strings)

## Code Style

- **Language**: TypeScript strict mode, Russian JSDoc comments
- **Linter/formatter**: Biome (not ESLint/Prettier). Run `pnpm lint` and `pnpm format`
- **Imports**: Use `@/*` alias for `./src/*`. Absolute imports only
- **Components**: Functional components, no class components. `"use client"` directive for interactive pages
- **Naming**: camelCase for variables/functions, PascalCase for components/types, kebab-case for files

## Build and Test

```bash
pnpm install          # Install dependencies
pnpm dev              # Dev server (http://localhost:3000)
pnpm build            # Production build (standalone output)
pnpm lint             # Biome check (lint + format check)
pnpm format           # Auto-format with Biome
pnpm db:push          # Apply schema to PostgreSQL
pnpm db:seed          # Seed test data
```

Required env vars: `DATABASE_URL`, `BOT_TOKEN`. See `.env.example`.

## Conventions

### API routes

- Every route wraps logic in `try/catch` with `console.error` + generic 500 response
- Auth: `requireAuth(request)` returns `{ user, error }` — check `error` first
- Admin routes: `requireAdmin(request)` — same pattern
- All user input goes through `src/lib/validation.ts` helpers (`sanitizeText`, `sanitizeUrl`, `sanitizeHandle`, `parseId`, etc.)
- Rate limiting via `isRateLimited(key, limit, windowMs)` on every endpoint
- Responses: `NextResponse.json(data)` with appropriate status codes

### Frontend patterns

- Auth state: `const { dbUser, isAdmin, isLoading, authHeaders } = useTelegram()`
- API calls: always pass `headers: authHeaders()` or `{ ...authHeaders() }`
- Toast notifications: `const toast = useToast()` → `toast.success()`, `toast.error()`
- Loading: show `<PageLoader />` while `isLoading`, skeleton components for data
- Destructive actions (delete, block): wrap in `<ConfirmDialog>` before executing

### Database

- Schema: `prisma/schema.prisma` — Prisma schema definitions with relations
- Connection: singleton via `globalThis` proxy (survives HMR), PrismaClient + `@prisma/adapter-pg`
- Migrations: `pnpm db:push` (schema push) or `pnpm db:migrate` (migration files in `prisma/migrations/`)

## Deployment

Docker multi-stage build → GitHub Container Registry → SSH deploy via GitHub Actions.
See `deploy/docker-compose.yml`, `.github/workflows/deploy.yml`, and `scripts/deploy/setup-server.sh` for details.
