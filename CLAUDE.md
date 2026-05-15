# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run build        # production build
npm test             # run all tests (vitest)
npx vitest run __tests__/api/books.test.ts   # run a single test file
docker compose up -d # start PostgreSQL
npx prisma migrate dev --name <name>  # apply schema changes
npx prisma studio    # browse database
```

## Architecture

**Data flow:** PostgreSQL (Prisma) → Server Component (`app/(app)/page.tsx`) → `LibraryClient` (Client Component) → API Routes → `router.refresh()` → Server Component re-fetches.

Mutations never touch Prisma directly from the client. All writes go through `/api/books/*` and are followed by `router.refresh()`, which triggers the Server Component to re-fetch and push fresh props down.

**Auth split — important:** There are two auth configs to avoid Prisma running in the Edge runtime:
- `lib/auth.config.ts` — Edge-safe (no Prisma), used by `middleware.ts` for route protection
- `lib/auth.ts` — full config with PrismaAdapter, used by Server Components and API routes

Session strategy is JWT. The `jwt` callback stores `user.id` in the token; the `session` callback reads it back as `session.user.id`.

**Route groups:**
- `app/(auth)/login` — unauthenticated, just the Google sign-in page
- `app/(app)/` — protected; middleware redirects unauthenticated users to `/login`

**Middleware matcher** excludes `api/books` and `api/auth` so those routes handle their own 401s rather than getting a redirect.

**Tailwind v4** — uses `@import "tailwindcss"` and an `@theme` block in `globals.css`, not a `tailwind.config.js`. Brand tokens are CSS variables: `--color-brand-*`, `--font-display`.

**Types:** `types.ts` defines `Book` and `Annotation` with `createdAt: string` (not `Date`). Prisma returns `DateTime`; the Server Component calls `.toISOString()` before passing to the client.

## Testing

Tests cover API routes only (`__tests__/api/`). They use `vi.mock` for both `@/lib/auth` (to inject a fake session) and `@/lib/prisma` (to avoid a real DB). There are no component tests.

To add a test for a new API route, follow the pattern in `__tests__/api/books.test.ts`: mock `auth` to return `{ user: { id: 'user-1' } }` and mock the relevant prisma methods.

## Environment

Requires `.env` (for Prisma CLI) and `.env.local` (for Next.js) with the same `DATABASE_URL`. Both are gitignored. See `.env.example` for the required keys: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.

Local DB: `docker compose up -d` starts PostgreSQL on port 5432 (`libros/libros@localhost/libros`).
