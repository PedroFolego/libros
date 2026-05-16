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

## Multi-Agent Orchestration

### Role of this (orchestrator) instance

The orchestrator **never writes code directly**. Its only job is to delegate work via the Task tool to the sub-agents below and coordinate their outputs.

### Standard flow

```
planner → coder → [tester + reviewer in parallel] → loop until clean → PR
```

1. **planner** — reads codebase, writes `PLAN.md`.
2. **coder** — reads `PLAN.md`, opens `feature/*` branch, implements, commits, opens PR.
3. **tester + reviewer** — run in parallel after each coder push.
4. If `REVIEW.md` has Critical or Warning items → coder addresses them → back to step 3.
5. When both `TEST_REPORT.md` and `REVIEW.md` are clean → PR is ready for human merge.

### Inviolable rules

| Agent | Can | Cannot |
|---|---|---|
| planner | Read, explore, write PLAN.md | Write code |
| coder | Write code, commit, open PR | Merge, force-push, edit REVIEW.md |
| reviewer | Read, run `git diff`, write REVIEW.md | Edit any source file |
| tester | Run tests, write TEST_REPORT.md | Edit any source file |

- One feature = one `feature/*` branch = one PR.
- All commits must follow **Conventional Commits** (`feat:`, `fix:`, `test:`, `chore:`, etc.).
- PRs are merged by a human only, never by an agent.

### Commands used by agents

```bash
npm test          # vitest run — full test suite
npm run lint      # next lint — ESLint
```

Default branch: **main**

## Premium / Stripe

### Environment variables

Add these to both `.env` and `.env.local` (see `.env.example` for a full list):

- `STRIPE_SECRET_KEY` — Stripe secret key (sk_test_... / sk_live_...)
- `STRIPE_WEBHOOK_SECRET` — from `stripe listen` or Stripe dashboard webhook settings
- `STRIPE_PRICE_ID` — the recurring Price ID of the Premium plan (price_...)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — publishable key (reserved for future Stripe.js use)

### Local webhook development

Install the Stripe CLI, then in a separate terminal run:
```
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Copy the displayed webhook signing secret and set it as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

### Flipping a test user to Premium manually

Run `npx prisma studio`, open the `User` table, and set `stripeCurrentPeriodEnd` to any future date. The next page navigation will re-evaluate the JWT and reflect `isPremium: true`.

### Edge-safety constraint

`lib/stripe.ts` uses Node.js built-ins and must never be imported from `lib/auth.config.ts` or `middleware.ts`. Stripe logic belongs exclusively in `lib/auth.ts`, `lib/stripe.ts`, and `app/api/stripe/*` routes.
