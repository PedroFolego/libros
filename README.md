# Libros

A personal library manager. Track your reading list, log annotations, and rate books — all behind Google sign-in so your shelf is private to you.

## Stack

- **Next.js 15** (App Router) with React 19
- **NextAuth v5** — Google OAuth, JWT sessions, PrismaAdapter
- **Prisma + PostgreSQL** — data layer
- **Tailwind CSS v4** — styling via `@theme` CSS variables
- **Framer Motion** — UI animations
- **Vitest** — API route tests

## Getting started

### 1. Start the database

```bash
docker compose up -d
```

### 2. Set up environment variables

Create both `.env` (for Prisma CLI) and `.env.local` (for Next.js) with:

```
DATABASE_URL=postgresql://libros:libros@localhost:5432/libros
AUTH_SECRET=<random secret>
AUTH_GOOGLE_ID=<your Google OAuth client ID>
AUTH_GOOGLE_SECRET=<your Google OAuth client secret>
```

### 3. Apply migrations and start

```bash
npx prisma migrate dev
npm run dev
```

The app runs at `http://localhost:3000`.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run all tests |
| `npx vitest run __tests__/api/books.test.ts` | Run a single test file |
| `docker compose up -d` | Start PostgreSQL |
| `npx prisma migrate dev --name <name>` | Apply schema changes |
| `npx prisma studio` | Browse the database |

## Project structure

```
app/
  (auth)/login/     # Google sign-in page (public)
  (app)/            # Protected routes (middleware redirect)
  api/              # API routes for book mutations
components/         # Client components (LibraryClient, BookCard, etc.)
lib/
  auth.config.ts    # Edge-safe auth config used by middleware
  auth.ts           # Full auth config with PrismaAdapter
  prisma.ts         # Prisma client singleton
prisma/
  schema.prisma     # DB schema
__tests__/api/      # Vitest API route tests
```

## Data model

- **User** — created on first Google sign-in
- **Book** — belongs to a user; has title, author, status, rating
- **Annotation** — free-text notes attached to a book

## Auth architecture

Two auth configs exist to avoid running Prisma in the Edge runtime:

- `lib/auth.config.ts` — Edge-safe, used by `middleware.ts` for route protection
- `lib/auth.ts` — full config with PrismaAdapter, used by server components and API routes

The middleware matcher excludes `/api/books` and `/api/auth` so those routes handle their own `401`s rather than redirecting.
