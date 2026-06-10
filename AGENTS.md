# AGENTS.md

## Code standards
- NEVER commit without explicit ask
- NEVER push to git without explicit ask
- NEVER modify production database without explicit ask

## Development Commands

- **Dev server**: `npm run dev` (requires `.env.development.local` with POSTGRES_PRISMA_URL)
- **Unit tests**: `npm test` (runs Jest with dotenv -e .env.test)
- **Lint**: `npm run lint` (ESLint with Next.js recommended rules)
- **Build**: `npm run build` (runs prisma:generate before Next.js build)

## Test Commands

- **Playwright UI tests**: `npm run test:ui` (starts dev:playwright automatically)
- **Playwright E2E tests**: `npm run test:ui:e2e` (runs `run-playwright-e2e-tests.sh`)
- **Integration tests**: `npm run test:integration` (requires PostgreSQL, uses `NODE_OPTIONS=--experimental-vm-modules`)
- **Single unit test**: `npx dotenv -e .env.test -- npx jest -t "test name"`
- **Integration tests with script**: `sh run-integration-tests.sh` (starts Docker PostgreSQL)

## Database

- **Prisma client** generated to `prisma/generated/client` (ESM format)
- **Migrations**: `npm run migrate` (dev server) or `npm run migrate:test` (test database)
- **Prisma Studio**: `npm run studio`

## Architecture

- **Type**: Next.js 16.x App Router project
- **Database**: PostgreSQL via Prisma
- **Import alias**: `@/` maps to project root
- **Node**: Requires >=22 <25

## Environment

- `.env.development.local` required for dev
- `.env.test` auto-created from `.env.example` if missing
- `CUESCORE_PROVIDER=fake` enables local fake provider in development

## Code Generation

- **Prisma client**: Auto-generated on build and pretest
- Always commit `prisma/generated/client` (generated, not vendored)

## Common Gotchas

- Run `prisma generate` after schema changes before importing PrismaClient
- Integration tests require experimental-vm-modules flag
- ESLint ignores `prisma/generated/**` - don't edit generated files

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Status tracked via `Status:` line near the top of each issue file; defaults to the five canonical roles. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Functional Scope

**Darts Tournament Management System** for Relax Darts Cup:

When deeper info about functional scope is necessary read `DARTS.md`.

### Core Features
- **Live Scoring (`/tables/[table]`)**: Tablet-optimized num-pad interface for real-time score entry, undo/redo, checkout dart selection (1-3 darts), 20s auto-refresh
- **Dashboard (`/dashboard`)**: 6-table grid showing live scores, player photos, averages, last throws
- **Statistics**: Season-based player rankings, tournament summaries, match details with throw-by-throw breakdown
- **Admin (`/admin`)**: Tournament CRUD via CueScore ID, set active tournament, include/exclude from global stats, password auth

### Key Workflows
- Scorekeeper: Navigate to `/tables/[table]` → auto-refresh → select starter → enter scores via num-pad → select checkout darts → finish match
- Admin: Login → create/open tournament by CueScore ID → set as active → monitor via `/dashboard`
