# Libros Next.js Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar o app Libros de Vite + React SPA para Next.js 15 com App Router, NextAuth.js v5 (Google OAuth), e PostgreSQL via Prisma.

**Architecture:** Substituição limpa no mesmo diretório — arquivos Vite removidos, projeto Next.js scaffoldado no lugar. A página principal é um Server Component que busca livros do Prisma e passa como props para um `LibraryClient` (Client Component) que gerencia todo o estado de UI. Mutações são feitas via API Routes (`/api/books/...`) e seguidas de `router.refresh()` para re-sincronizar com o servidor.

**Tech Stack:** Next.js 15 (App Router), NextAuth.js v5, @auth/prisma-adapter, Prisma 6, PostgreSQL, Tailwind CSS v4, lucide-react, motion/react, Vitest.

---

## File Map

| Arquivo | Tipo | Responsabilidade |
|---|---|---|
| `next.config.ts` | Config | Configuração Next.js |
| `tsconfig.json` | Config | TypeScript para Next.js |
| `postcss.config.mjs` | Config | Tailwind v4 via PostCSS |
| `middleware.ts` | Server | Redireciona não-autenticados para /login |
| `types.ts` | Shared | Tipos Book, Annotation, BookStatus |
| `types/next-auth.d.ts` | Types | Augmenta Session com user.id |
| `prisma/schema.prisma` | DB | Modelos User, Book, Annotation + NextAuth |
| `lib/prisma.ts` | Lib | Singleton do PrismaClient |
| `lib/auth.ts` | Lib | Configuração NextAuth (Google + Prisma adapter) |
| `app/layout.tsx` | Server | Root layout com SessionProvider |
| `app/globals.css` | Style | Tailwind + tema brand |
| `app/(auth)/login/page.tsx` | Server | Tela de login com botão Google |
| `app/(app)/layout.tsx` | Server | Layout autenticado (wrapper) |
| `app/(app)/page.tsx` | Server | Busca livros do DB, renderiza LibraryClient |
| `app/api/auth/[...nextauth]/route.ts` | API | Handler NextAuth |
| `app/api/books/route.ts` | API | GET lista de livros, POST criar livro |
| `app/api/books/[id]/route.ts` | API | PUT atualizar livro, DELETE remover livro |
| `app/api/books/[id]/annotations/route.ts` | API | POST criar anotação, DELETE remover |
| `components/Rating.tsx` | Client | Estrelas de avaliação (interativas ou estáticas) |
| `components/AddBookModal.tsx` | Client | Modal de cadastro de novo livro |
| `components/BookCard.tsx` | Client | Card de livro (featured e compact) |
| `components/BookDetail.tsx` | Client | Detalhe do livro + anotações |
| `components/Sidebar.tsx` | Client | Filtros de status + exportar biblioteca |
| `components/LibraryClient.tsx` | Client | Estado central da UI (filtro, busca, seleção) |
| `__tests__/api/books.test.ts` | Test | Testes GET/POST /api/books |
| `__tests__/api/books-id.test.ts` | Test | Testes PUT/DELETE /api/books/[id] |
| `__tests__/api/annotations.test.ts` | Test | Testes POST/DELETE annotations |
| `vitest.config.ts` | Config | Configuração Vitest |

---

## Task 1: Teardown Vite + Scaffold Next.js

**Files:**
- Delete: `vite.config.ts`, `index.html`, `src/` (entire directory)
- Create: `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `package.json` (rewrite)

- [ ] **Step 1: Remover arquivos Vite**

```bash
rm -rf src vite.config.ts index.html
```

- [ ] **Step 2: Reescrever package.json**

```json
{
  "name": "libros",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "^15.3.2",
    "next-auth": "^5.0.0-beta.25",
    "@auth/prisma-adapter": "^2.9.1",
    "@prisma/client": "^6.8.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "prisma": "^6.8.2",
    "tailwindcss": "^4.1.14",
    "@tailwindcss/postcss": "^4.1.14",
    "typescript": "~5.8.2",
    "vitest": "^3.2.2"
  }
}
```

- [ ] **Step 3: Criar next.config.ts**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: Criar tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Criar postcss.config.mjs**

```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

- [ ] **Step 6: Instalar dependências**

```bash
npm install
```

Expected: sem erros críticos (warnings de peer deps são aceitáveis).

- [ ] **Step 7: Commit**

```bash
git add package.json next.config.ts tsconfig.json postcss.config.mjs
git commit -m "chore: replace Vite with Next.js 15 scaffold"
```

---

## Task 2: Prisma Schema + .env.local

**Files:**
- Create: `prisma/schema.prisma`, `.env.local`

- [ ] **Step 1: Inicializar Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

Expected: cria `prisma/schema.prisma` e `.env` com DATABASE_URL.

- [ ] **Step 2: Renomear .env para .env.local e adicionar todas as variáveis**

```bash
mv .env .env.local
```

Conteúdo de `.env.local`:
```env
# Banco de dados (Neon, Supabase, ou local)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/libros?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="gerar_com: openssl rand -base64 32"

# Google OAuth - obter em console.cloud.google.com
AUTH_GOOGLE_ID="seu_client_id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="seu_client_secret"
```

- [ ] **Step 3: Reescrever prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  books         Book[]
  accounts      Account[]
  sessions      Session[]
}

model Book {
  id          String       @id @default(cuid())
  title       String
  author      String
  status      String
  rating      Int          @default(0)
  createdAt   DateTime     @default(now())
  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  annotations Annotation[]
}

model Annotation {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  bookId    String
  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
}

// Modelos obrigatórios do NextAuth / @auth/prisma-adapter
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

- [ ] **Step 4: Verificar tipos gerados (sem migrar ainda — precisa de DATABASE_URL real)**

```bash
npx prisma generate
```

Expected: "Generated Prisma Client" sem erros.

- [ ] **Step 5: Commit**

```bash
git add prisma/ .env.local
git commit -m "chore: add Prisma schema with Book, Annotation, and NextAuth models"
```

---

## Task 3: lib/prisma.ts + lib/auth.ts + types

**Files:**
- Create: `lib/prisma.ts`, `lib/auth.ts`, `types.ts`, `types/next-auth.d.ts`

- [ ] **Step 1: Criar lib/prisma.ts**

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [ ] **Step 2: Criar lib/auth.ts**

```typescript
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
```

- [ ] **Step 3: Criar types/next-auth.d.ts**

```typescript
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
```

- [ ] **Step 4: Criar types.ts**

```typescript
export type BookStatus = 'reading' | 'want-to-read' | 'finished' | 'all';

export interface Annotation {
  id: string;
  content: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  annotations: Annotation[];
  status: Exclude<BookStatus, 'all'>;
  rating: number;
  createdAt: string;
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/ types.ts types/
git commit -m "feat: add Prisma singleton, NextAuth config, and shared types"
```

---

## Task 4: Middleware + NextAuth Route

**Files:**
- Create: `middleware.ts`, `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Criar middleware.ts**

```typescript
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (!isLoggedIn && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url));
  }
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 2: Criar app/api/auth/[...nextauth]/route.ts**

```typescript
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
```

- [ ] **Step 3: Commit**

```bash
git add middleware.ts app/api/auth/
git commit -m "feat: add NextAuth route handler and middleware for route protection"
```

---

## Task 5: App Shell (globals.css + layouts + login)

**Files:**
- Create: `app/globals.css`, `app/layout.tsx`, `app/(auth)/login/page.tsx`, `app/(app)/layout.tsx`

- [ ] **Step 1: Criar app/globals.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;1,400;1,600&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Playfair Display", serif;

  --color-brand-bg: #F7F4F0;
  --color-brand-text: #2D2A26;
  --color-brand-primary: #4A3E3F;
  --color-brand-border: #E5E1DA;
  --color-brand-muted: #A19B91;
  --color-brand-subtle: #FDFCFB;
}

body {
  background-color: var(--color-brand-bg);
  color: var(--color-brand-text);
}
```

- [ ] **Step 2: Criar app/layout.tsx**

```typescript
import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Libros',
  description: 'Sua biblioteca pessoal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Criar app/(auth)/login/page.tsx**

```typescript
import { signIn } from '@/lib/auth';
import { BookOpen } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-brand-border p-10 w-full max-w-sm shadow-sm text-center">
        <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-display mb-2">Libros</h1>
        <p className="text-brand-muted text-sm mb-8">Sua biblioteca pessoal</p>
        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/' });
          }}
        >
          <button
            type="submit"
            className="w-full py-3 bg-brand-primary text-white rounded-xl font-bold uppercase text-sm tracking-widest hover:opacity-90 transition-opacity"
          >
            Entrar com Google
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Criar app/(app)/layout.tsx**

```typescript
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-primary selection:text-white pb-20">
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add app/
git commit -m "feat: add app shell, root layout, login page, and authenticated layout"
```

---

## Task 6: Vitest Setup

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Criar vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 2: Verificar que Vitest roda sem erros**

```bash
npx vitest run
```

Expected: "No test files found" — OK, ainda não há testes.

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: add Vitest config for API route testing"
```

---

## Task 7: API Route — GET + POST /api/books (TDD)

**Files:**
- Create: `__tests__/api/books.test.ts`, `app/api/books/route.ts`

- [ ] **Step 1: Escrever os testes**

```typescript
// __tests__/api/books.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    book: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GET, POST } from '@/app/api/books/route';

const mockAuth = vi.mocked(auth);
const mockFindMany = vi.mocked(prisma.book.findMany);
const mockCreate = vi.mocked(prisma.book.create);

beforeEach(() => vi.clearAllMocks());

describe('GET /api/books', () => {
  it('retorna 401 quando não autenticado', async () => {
    mockAuth.mockResolvedValue(null as any);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('retorna livros do usuário autenticado', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    const livros = [
      { id: 'b1', title: 'Livro A', author: 'Autor', status: 'reading', rating: 0, createdAt: new Date(), userId: 'user-1', annotations: [] },
    ];
    mockFindMany.mockResolvedValue(livros as any);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe('Livro A');
  });
});

describe('POST /api/books', () => {
  it('retorna 401 quando não autenticado', async () => {
    mockAuth.mockResolvedValue(null as any);
    const req = new Request('http://localhost/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test', author: 'Autor', status: 'reading' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('retorna 400 quando campos obrigatórios estão faltando', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    const req = new Request('http://localhost/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('cria e retorna um livro com status 201', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    const novoLivro = { id: 'b2', title: 'Novo', author: 'Autor', status: 'want-to-read', rating: 0, createdAt: new Date(), userId: 'user-1', annotations: [] };
    mockCreate.mockResolvedValue(novoLivro as any);
    const req = new Request('http://localhost/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Novo', author: 'Autor', status: 'want-to-read' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.title).toBe('Novo');
  });
});
```

- [ ] **Step 2: Rodar os testes para confirmar que FALHAM**

```bash
npx vitest run __tests__/api/books.test.ts
```

Expected: FAIL — "Cannot find module '@/app/api/books/route'"

- [ ] **Step 3: Implementar app/api/books/route.ts**

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const books = await prisma.book.findMany({
    where: { userId: session.user.id },
    include: { annotations: { orderBy: { createdAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(books);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, author, status } = await request.json();
  if (!title || !author || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const book = await prisma.book.create({
    data: { title, author, status, userId: session.user.id },
    include: { annotations: true },
  });

  return NextResponse.json(book, { status: 201 });
}
```

- [ ] **Step 4: Rodar os testes para confirmar que PASSAM**

```bash
npx vitest run __tests__/api/books.test.ts
```

Expected: PASS — todos os 5 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add __tests__/api/books.test.ts app/api/books/route.ts
git commit -m "feat: add GET and POST /api/books with tests"
```

---

## Task 8: API Route — PUT + DELETE /api/books/[id] (TDD)

**Files:**
- Create: `__tests__/api/books-id.test.ts`, `app/api/books/[id]/route.ts`

- [ ] **Step 1: Escrever os testes**

```typescript
// __tests__/api/books-id.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    book: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PUT, DELETE } from '@/app/api/books/[id]/route';

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.book.findUnique);
const mockUpdate = vi.mocked(prisma.book.update);
const mockDelete = vi.mocked(prisma.book.delete);

const params = Promise.resolve({ id: 'book-1' });
const livroFixture = { id: 'book-1', userId: 'user-1', title: 'T', author: 'A', status: 'reading', rating: 0, createdAt: new Date(), annotations: [] };

beforeEach(() => vi.clearAllMocks());

describe('PUT /api/books/[id]', () => {
  it('retorna 401 quando não autenticado', async () => {
    mockAuth.mockResolvedValue(null as any);
    const req = new Request('http://localhost/api/books/book-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'finished' }),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(401);
  });

  it('retorna 404 quando livro não existe', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockFindUnique.mockResolvedValue(null);
    const req = new Request('http://localhost/api/books/book-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'finished' }),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(404);
  });

  it('retorna 403 quando livro pertence a outro usuário', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'outro-user' } } as any);
    mockFindUnique.mockResolvedValue(livroFixture as any);
    const req = new Request('http://localhost/api/books/book-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'finished' }),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(403);
  });

  it('atualiza e retorna o livro', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockFindUnique.mockResolvedValue(livroFixture as any);
    const updated = { ...livroFixture, status: 'finished' };
    mockUpdate.mockResolvedValue(updated as any);
    const req = new Request('http://localhost/api/books/book-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'finished' }),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('finished');
  });
});

describe('DELETE /api/books/[id]', () => {
  it('retorna 401 quando não autenticado', async () => {
    mockAuth.mockResolvedValue(null as any);
    const req = new Request('http://localhost/api/books/book-1', { method: 'DELETE' });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando livro pertence a outro usuário', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'outro-user' } } as any);
    mockFindUnique.mockResolvedValue(livroFixture as any);
    const req = new Request('http://localhost/api/books/book-1', { method: 'DELETE' });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(403);
  });

  it('deleta o livro e retorna 204', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockFindUnique.mockResolvedValue(livroFixture as any);
    mockDelete.mockResolvedValue(livroFixture as any);
    const req = new Request('http://localhost/api/books/book-1', { method: 'DELETE' });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(204);
  });
});
```

- [ ] **Step 2: Rodar para confirmar que FALHAM**

```bash
npx vitest run __tests__/api/books-id.test.ts
```

Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Implementar app/api/books/[id]/route.ts**

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const updates = await request.json();

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (book.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updated = await prisma.book.update({
    where: { id },
    data: updates,
    include: { annotations: { orderBy: { createdAt: 'desc' } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (book.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.book.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 4: Rodar para confirmar que PASSAM**

```bash
npx vitest run __tests__/api/books-id.test.ts
```

Expected: PASS — todos os 7 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add __tests__/api/books-id.test.ts app/api/books/
git commit -m "feat: add PUT and DELETE /api/books/[id] with tests"
```

---

## Task 9: API Route — Annotations (TDD)

**Files:**
- Create: `__tests__/api/annotations.test.ts`, `app/api/books/[id]/annotations/route.ts`

- [ ] **Step 1: Escrever os testes**

```typescript
// __tests__/api/annotations.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    book: { findUnique: vi.fn() },
    annotation: { create: vi.fn(), delete: vi.fn() },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { POST, DELETE } from '@/app/api/books/[id]/annotations/route';

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.book.findUnique);
const mockCreate = vi.mocked(prisma.annotation.create);
const mockDelete = vi.mocked(prisma.annotation.delete);

const params = Promise.resolve({ id: 'book-1' });
const livroFixture = { id: 'book-1', userId: 'user-1', title: 'T', author: 'A', status: 'reading', rating: 0, createdAt: new Date() };

beforeEach(() => vi.clearAllMocks());

describe('POST /api/books/[id]/annotations', () => {
  it('retorna 401 quando não autenticado', async () => {
    mockAuth.mockResolvedValue(null as any);
    const req = new Request('http://localhost/api/books/book-1/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Nota interessante' }),
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(401);
  });

  it('retorna 400 quando content está vazio', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockFindUnique.mockResolvedValue(livroFixture as any);
    const req = new Request('http://localhost/api/books/book-1/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '   ' }),
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(400);
  });

  it('cria anotação e retorna 201', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockFindUnique.mockResolvedValue(livroFixture as any);
    const ann = { id: 'a1', content: 'Nota interessante', createdAt: new Date(), bookId: 'book-1' };
    mockCreate.mockResolvedValue(ann as any);
    const req = new Request('http://localhost/api/books/book-1/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Nota interessante' }),
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.content).toBe('Nota interessante');
  });
});

describe('DELETE /api/books/[id]/annotations', () => {
  it('retorna 400 quando annotationId não informado', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockFindUnique.mockResolvedValue(livroFixture as any);
    const req = new Request('http://localhost/api/books/book-1/annotations', { method: 'DELETE' });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(400);
  });

  it('deleta anotação e retorna 204', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockFindUnique.mockResolvedValue(livroFixture as any);
    mockDelete.mockResolvedValue({ id: 'a1', content: 'x', createdAt: new Date(), bookId: 'book-1' });
    const req = new Request('http://localhost/api/books/book-1/annotations?annotationId=a1', { method: 'DELETE' });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(204);
  });
});
```

- [ ] **Step 2: Rodar para confirmar que FALHAM**

```bash
npx vitest run __tests__/api/annotations.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implementar app/api/books/[id]/annotations/route.ts**

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: bookId } = await params;
  const { content } = await request.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 });
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (book.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const annotation = await prisma.annotation.create({
    data: { content: content.trim(), bookId },
  });

  return NextResponse.json(annotation, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: bookId } = await params;
  const { searchParams } = new URL(request.url);
  const annotationId = searchParams.get('annotationId');
  if (!annotationId) {
    return NextResponse.json({ error: 'annotationId required' }, { status: 400 });
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (book.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.annotation.delete({ where: { id: annotationId } });
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 4: Rodar toda a suíte para confirmar que tudo passa**

```bash
npx vitest run
```

Expected: PASS — todos os testes verdes.

- [ ] **Step 5: Commit**

```bash
git add __tests__/api/annotations.test.ts app/api/books/
git commit -m "feat: add POST and DELETE /api/books/[id]/annotations with tests"
```

---

## Task 10: Componentes de UI — Rating + AddBookModal

**Files:**
- Create: `components/Rating.tsx`, `components/AddBookModal.tsx`

- [ ] **Step 1: Criar components/Rating.tsx**

```typescript
'use client';

import { Star } from 'lucide-react';

interface RatingProps {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  interactive?: boolean;
}

export default function Rating({ value, onChange, size = 16, interactive = false }: RatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`${star <= value ? 'fill-amber-400 text-amber-400' : 'text-brand-border'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={(e) => {
            if (interactive && onChange) {
              e.stopPropagation();
              onChange(star);
            }
          }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Criar components/AddBookModal.tsx**

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark, BookOpen, CheckCircle2 } from 'lucide-react';
import type { BookStatus } from '@/types';

interface AddBookModalProps {
  onAdd: (data: { title: string; author: string; status: Exclude<BookStatus, 'all'> }) => void;
  onClose: () => void;
}

export default function AddBookModal({ onAdd, onClose }: AddBookModalProps) {
  const [form, setForm] = useState({
    title: '',
    author: '',
    status: 'want-to-read' as Exclude<BookStatus, 'all'>,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.author) return;
    onAdd(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-primary/20 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 border border-brand-border shadow-2xl"
      >
        <h2 className="text-3xl font-display mb-8">Novo Livro</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-brand-muted tracking-[0.15em] ml-1">Título</label>
            <input
              autoFocus
              required
              type="text"
              placeholder="Ex: O Pequeno Príncipe"
              className="w-full px-5 py-4 bg-brand-bg border border-brand-border rounded-xl text-brand-text focus:ring-1 focus:ring-brand-primary outline-none transition-all"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-brand-muted tracking-[0.15em] ml-1">Autor</label>
            <input
              required
              type="text"
              placeholder="Ex: Antoine de Saint-Exupéry"
              className="w-full px-5 py-4 bg-brand-bg border border-brand-border rounded-xl text-brand-text focus:ring-1 focus:ring-brand-primary outline-none transition-all"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'want-to-read', label: 'Lista', icon: Bookmark },
              { id: 'reading', label: 'Lendo', icon: BookOpen },
              { id: 'finished', label: 'Lido', icon: CheckCircle2 },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setForm({ ...form, status: s.id as Exclude<BookStatus, 'all'> })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${form.status === s.id ? 'border-brand-primary bg-brand-primary text-white' : 'border-brand-bg bg-brand-bg text-brand-muted'}`}
              >
                <s.icon className="w-5 h-5" />
                <span className="text-[8px] font-bold uppercase">{s.label}</span>
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold uppercase text-sm tracking-widest shadow-lg shadow-brand-primary/20 hover:opacity-90 transition-opacity mt-4"
          >
            Adicionar à Estante
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 text-brand-muted font-semibold text-xs hover:text-brand-text transition-colors"
          >
            Cancelar
          </button>
        </form>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/Rating.tsx components/AddBookModal.tsx
git commit -m "feat: add Rating and AddBookModal components"
```

---

## Task 11: Componentes de UI — BookCard + BookDetail

**Files:**
- Create: `components/BookCard.tsx`, `components/BookDetail.tsx`

- [ ] **Step 1: Criar components/BookCard.tsx**

```typescript
'use client';

import { motion } from 'motion/react';
import { MessageSquare, Bookmark, BookOpen, CheckCircle2 } from 'lucide-react';
import type { Book, BookStatus } from '@/types';
import Rating from './Rating';

interface BookCardProps {
  book: Book;
  index: number;
  searchTerm: string;
  onSelect: (id: string) => void;
  onUpdateStatus: (id: string, status: Exclude<BookStatus, 'all'>) => void;
}

export default function BookCard({ book, index, searchTerm, onSelect, onUpdateStatus }: BookCardProps) {
  const isFeatured = index === 0 && !searchTerm;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-2xl border border-brand-border p-6 flex flex-col h-full hover:shadow-xl hover:shadow-black/[0.02] transition-all group overflow-hidden cursor-pointer ${isFeatured ? 'lg:col-span-2 flex-row gap-8 items-center bg-gradient-to-br from-white to-[#F9F8F6]' : ''}`}
      onClick={() => onSelect(book.id)}
    >
      {isFeatured ? (
        <>
          <div className="w-24 h-36 sm:w-32 sm:h-48 bg-brand-primary rounded shadow-xl shrink-0 flex flex-col items-center justify-center p-3 text-center text-white">
            <p className="text-[6px] sm:text-[8px] uppercase tracking-widest opacity-60 mb-1">{book.author}</p>
            <h4 className="text-xs sm:text-sm font-display leading-[1.2] line-clamp-3">{book.title}</h4>
            <div className="mt-auto w-8 h-0.5 bg-white/30" />
          </div>
          <div className="flex-grow flex flex-col gap-4">
            <div>
              <span className="px-2 py-0.5 bg-brand-border text-[9px] font-bold uppercase rounded-md text-brand-text">
                {book.status === 'reading' ? 'Lendo Agora' : book.status === 'finished' ? 'Concluído' : 'Lista de Leitura'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-display mt-2 leading-tight truncate">{book.title}</h3>
              <p className="text-brand-muted italic text-sm">{book.author}</p>
            </div>
            <div className="flex items-center gap-2 mt-auto">
              <span className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-lg flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                {book.annotations.length > 0 ? `${book.annotations.length} Notas` : 'Anotar'}
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-grow min-w-0">
              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider mb-1 ${
                book.status === 'reading' ? 'bg-amber-100 text-amber-800' :
                book.status === 'finished' ? 'bg-emerald-100 text-emerald-800' :
                'bg-brand-bg text-brand-muted border border-brand-border'
              }`}>
                {book.status === 'reading' ? 'Lendo' : book.status === 'finished' ? 'Lido' : 'Para ler'}
              </span>
              <h3 className="text-lg font-bold leading-snug truncate">{book.title}</h3>
              <p className="text-brand-muted text-xs font-medium truncate mb-1">{book.author}</p>
              <Rating value={book.rating} size={12} />
            </div>
          </div>
          <div className="mt-auto pt-4 border-t border-brand-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[...Array(Math.min(3, book.annotations.length))].map((_, i) => (
                  <div key={i} className="w-4 h-4 rounded-full bg-brand-border border border-white" />
                ))}
              </div>
              <span className="text-[10px] font-bold text-brand-muted uppercase">
                {book.annotations.length === 0 ? 'Sem notas' : `${book.annotations.length} notas`}
              </span>
            </div>
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5">
              {([
                { s: 'want-to-read', Icon: Bookmark },
                { s: 'reading', Icon: BookOpen },
                { s: 'finished', Icon: CheckCircle2 },
              ] as const).map(({ s, Icon }) => (
                <button
                  key={s}
                  onClick={() => onUpdateStatus(book.id, s)}
                  className={`p-1 rounded-lg border transition-all ${book.status === s ? 'bg-brand-primary border-brand-primary text-white' : 'border-brand-border text-brand-muted'}`}
                >
                  <Icon className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      {book.annotations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-brand-border line-clamp-2 italic text-xs text-brand-muted leading-relaxed">
          &quot;{book.annotations[0].content}&quot;
        </div>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 2: Criar components/BookDetail.tsx**

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, MessageSquare, BookOpen, CheckCircle2, Bookmark, Search } from 'lucide-react';
import type { Book, BookStatus } from '@/types';
import Rating from './Rating';

interface BookDetailProps {
  book: Book;
  onBack: () => void;
  onUpdateBook: (id: string, updates: Partial<Pick<Book, 'status' | 'rating'>>) => void;
  onDeleteBook: (id: string) => void;
  onAddAnnotation: (bookId: string, content: string) => void;
  onDeleteAnnotation: (bookId: string, annotationId: string) => void;
}

export default function BookDetail({
  book,
  onBack,
  onUpdateBook,
  onDeleteBook,
  onAddAnnotation,
  onDeleteAnnotation,
}: BookDetailProps) {
  const [newAnnotation, setNewAnnotation] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="bg-white rounded-2xl border border-brand-border p-8 flex flex-col sm:flex-row gap-8 items-start sm:items-center bg-gradient-to-br from-white to-[#F9F8F6]">
        <div className="w-32 h-48 bg-brand-primary rounded shadow-2xl shrink-0 flex flex-col items-center justify-center p-4 text-center text-white">
          <p className="text-[8px] uppercase tracking-widest opacity-60 mb-2">{book.author}</p>
          <h2 className="text-lg font-display leading-[1.2] line-clamp-4">{book.title}</h2>
          <div className="mt-auto w-10 h-0.5 bg-white/30" />
        </div>
        <div className="flex-grow space-y-4 w-full">
          <div>
            <button
              onClick={onBack}
              className="text-brand-muted hover:text-brand-text flex items-center gap-1 text-xs font-bold uppercase tracking-widest mb-2"
            >
              <Search className="w-3 h-3 rotate-180" /> Voltar
            </button>
            <h1 className="text-4xl font-display leading-tight">{book.title}</h1>
            <p className="text-brand-muted italic text-lg">{book.author}</p>
            <div className="mt-2">
              <Rating
                value={book.rating}
                interactive
                onChange={(v) => onUpdateBook(book.id, { rating: v })}
                size={24}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {([
              { id: 'want-to-read', label: 'Lista', Icon: Bookmark },
              { id: 'reading', label: 'Lendo', Icon: BookOpen },
              { id: 'finished', label: 'Lido', Icon: CheckCircle2 },
            ] as const).map((s) => (
              <button
                key={s.id}
                onClick={() => onUpdateBook(book.id, { status: s.id })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all text-xs font-bold uppercase tracking-widest ${book.status === s.id ? 'bg-brand-primary border-brand-primary text-white shadow-md' : 'bg-white border-brand-border text-brand-muted hover:border-brand-primary hover:text-brand-primary'}`}
              >
                <s.Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            ))}
            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja remover este livro?')) {
                  onDeleteBook(book.id);
                }
              }}
              className="ml-auto p-2 text-brand-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Annotations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-white rounded-2xl border border-brand-border p-6 flex flex-col shadow-sm">
          <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-4">Nova Anotação</h3>
          <textarea
            value={newAnnotation}
            onChange={(e) => setNewAnnotation(e.target.value)}
            placeholder="O que esta obra te faz pensar agora?"
            className="flex-grow w-full bg-brand-bg rounded-xl p-4 text-sm font-medium border-none focus:ring-1 focus:ring-brand-primary outline-none transition-all resize-none min-h-[150px]"
          />
          <button
            onClick={() => {
              if (newAnnotation.trim()) {
                onAddAnnotation(book.id, newAnnotation);
                setNewAnnotation('');
              }
            }}
            className="mt-4 w-full py-3 bg-brand-primary text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-md hover:opacity-90 transition-opacity"
          >
            Salvar Pensamento
          </button>
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-brand-border p-6 shadow-sm min-h-[400px]">
          <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-6">
            Anotações Anteriores ({book.annotations.length})
          </h3>
          <div className="space-y-4">
            {book.annotations.length === 0 ? (
              <div className="text-center py-20 opacity-30">
                <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                <p className="font-display italic">Nenhuma anotação ainda...</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {book.annotations.map((ann) => (
                  <motion.div
                    key={ann.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-brand-bg/50 border-l-4 border-brand-primary rounded-r-xl relative group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[8px] font-bold text-brand-muted uppercase tracking-widest">
                        {new Date(ann.createdAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(ann.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => onDeleteAnnotation(book.id, ann.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-brand-muted hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-medium text-brand-text leading-relaxed whitespace-pre-wrap">
                      {ann.content}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/BookCard.tsx components/BookDetail.tsx
git commit -m "feat: add BookCard and BookDetail components"
```

---

## Task 12: Componentes de UI — Sidebar + LibraryClient

**Files:**
- Create: `components/Sidebar.tsx`, `components/LibraryClient.tsx`

- [ ] **Step 1: Criar components/Sidebar.tsx**

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Bookmark, CheckCircle2, FileText, Copy, X } from 'lucide-react';
import type { Book, BookStatus } from '@/types';

interface SidebarProps {
  books: Book[];
  activeFilter: BookStatus;
  selectedBookId: string | null;
  onFilterChange: (filter: BookStatus) => void;
}

export default function Sidebar({ books, activeFilter, selectedBookId, onFilterChange }: SidebarProps) {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const filters = [
    { id: 'all' as BookStatus, icon: BookOpen, label: 'Todos', count: books.length },
    { id: 'reading' as BookStatus, icon: BookOpen, label: 'Lendo agora', count: books.filter(b => b.status === 'reading').length },
    { id: 'want-to-read' as BookStatus, icon: Bookmark, label: 'Para ler', count: books.filter(b => b.status === 'want-to-read').length },
    { id: 'finished' as BookStatus, icon: CheckCircle2, label: 'Concluídos', count: books.filter(b => b.status === 'finished').length },
  ];

  const finishedBooks = books
    .filter(b => b.status === 'finished')
    .sort((a, b) => b.rating - a.rating);

  return (
    <>
      <div className="bg-white rounded-2xl border border-brand-border p-6 flex flex-col gap-6 h-full shadow-sm">
        <div>
          <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-4">Minha Biblioteca</h3>
          <ul className="space-y-2">
            {filters.map((item) => {
              const isActive = activeFilter === item.id && !selectedBookId;
              return (
                <li
                  key={item.id}
                  onClick={() => onFilterChange(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isActive ? 'bg-brand-bg border-brand-border' : 'border-transparent text-brand-muted hover:bg-brand-bg/50'}`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-primary' : ''}`} />
                  <span className={`text-sm ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                  <span className="ml-auto text-xs opacity-40">{item.count}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-4">Exportar</h3>
          <button
            onClick={() => setIsSummaryOpen(true)}
            className="w-full flex items-center gap-3 p-3 text-sm text-brand-muted hover:text-brand-text hover:bg-brand-bg/50 rounded-xl transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Compactar Biblioteca</span>
          </button>
        </div>

        <div className="mt-auto p-4 bg-brand-primary rounded-xl text-white shadow-lg shadow-brand-primary/10">
          <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Total lidos</p>
          <p className="text-xl font-display italic">{finishedBooks.length} livros</p>
          <div className="w-full h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (finishedBooks.length / 10) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Summary Modal */}
      <AnimatePresence>
        {isSummaryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSummaryOpen(false)}
              className="absolute inset-0 bg-brand-primary/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl p-8 sm:p-10 border border-brand-border shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-display">Compactar Biblioteca</h2>
                <button
                  onClick={() => setIsSummaryOpen(false)}
                  className="p-2 border border-brand-border rounded-lg text-brand-muted hover:text-brand-text transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-brand-muted text-sm mb-6">Todos os seus livros formatados para fácil compartilhamento.</p>
              <div className="flex-grow overflow-y-auto bg-brand-bg rounded-2xl p-6 font-mono text-xs leading-relaxed border border-brand-border">
                {finishedBooks.length === 0 ? (
                  <p className="text-center py-10 text-brand-muted">Nenhum livro marcado como "Lido".</p>
                ) : (
                  finishedBooks.map((book) => (
                    <div key={book.id} className="mb-2">
                      <p className="text-brand-primary">
                        {book.title} — {book.author}: <span className="font-bold">{book.rating}/5</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-8">
                <button
                  onClick={() => {
                    const text = finishedBooks.map(b => `${b.title} — ${b.author}: ${b.rating}/5`).join('\n');
                    navigator.clipboard.writeText(text);
                    alert('Biblioteca copiada!');
                  }}
                  disabled={finishedBooks.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-brand-primary text-white rounded-xl font-bold uppercase text-sm tracking-widest shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Copy className="w-4 h-4" />
                  Copiar tudo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 2: Criar components/LibraryClient.tsx**

```typescript
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'motion/react';
import { Plus, Search, Book as BookIcon } from 'lucide-react';
import type { Book, BookStatus } from '@/types';
import Sidebar from './Sidebar';
import BookCard from './BookCard';
import BookDetail from './BookDetail';
import AddBookModal from './AddBookModal';

interface LibraryClientProps {
  initialBooks: Book[];
  userInitials: string;
  userImage?: string | null;
}

export default function LibraryClient({ initialBooks, userInitials, userImage }: LibraryClientProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<BookStatus>('all');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedBook = useMemo(() => initialBooks.find(b => b.id === selectedBookId), [initialBooks, selectedBookId]);

  const filteredBooks = useMemo(() => {
    return initialBooks.filter(book => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'all' || book.status === activeFilter;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [initialBooks, searchTerm, activeFilter]);

  const refresh = () => router.refresh();

  const addBook = async (data: { title: string; author: string; status: Exclude<BookStatus, 'all'> }) => {
    await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setIsAdding(false);
    refresh();
  };

  const updateBook = async (id: string, updates: Partial<Pick<Book, 'status' | 'rating'>>) => {
    await fetch(`/api/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    refresh();
  };

  const deleteBook = async (id: string) => {
    await fetch(`/api/books/${id}`, { method: 'DELETE' });
    setSelectedBookId(null);
    refresh();
  };

  const addAnnotation = async (bookId: string, content: string) => {
    await fetch(`/api/books/${bookId}/annotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    refresh();
  };

  const deleteAnnotation = async (bookId: string, annotationId: string) => {
    await fetch(`/api/books/${bookId}/annotations?annotationId=${annotationId}`, { method: 'DELETE' });
    refresh();
  };

  return (
    <>
      {/* Nav */}
      <nav className="h-16 px-6 sm:px-8 flex items-center justify-between bg-white border-b border-brand-border sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => { setSelectedBookId(null); setActiveFilter('all'); }}
        >
          <div className="w-8 h-8 bg-brand-primary rounded flex items-center justify-center">
            <BookIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight uppercase">Libros</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (selectedBookId) setSelectedBookId(null);
              }}
              className="pl-8 pr-3 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-xs focus:ring-1 focus:ring-brand-primary outline-none w-32 sm:w-64 transition-all"
            />
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-brand-primary text-white p-2 sm:px-4 sm:py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-border border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-brand-muted text-xs font-bold">
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userImage} alt="avatar" className="w-full h-full object-cover" />
            ) : userInitials}
          </div>
        </div>
      </nav>

      {/* Main grid */}
      <main className="max-w-[1200px] mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4">
        <aside className="md:col-span-3 space-y-4">
          <Sidebar
            books={initialBooks}
            activeFilter={activeFilter}
            selectedBookId={selectedBookId}
            onFilterChange={(f) => { setActiveFilter(f); setSelectedBookId(null); }}
          />
        </aside>

        <section className="md:col-span-9 space-y-4">
          {selectedBook ? (
            <BookDetail
              book={selectedBook}
              onBack={() => setSelectedBookId(null)}
              onUpdateBook={updateBook}
              onDeleteBook={deleteBook}
              onAddAnnotation={addAnnotation}
              onDeleteAnnotation={deleteAnnotation}
            />
          ) : filteredBooks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-brand-border p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 bg-brand-bg rounded-2xl flex items-center justify-center mb-6 border border-brand-border">
                <Search className="w-8 h-8 text-brand-muted" />
              </div>
              <h2 className="text-2xl font-display italic mb-2">Página em branco...</h2>
              <p className="text-brand-muted max-w-xs mx-auto text-sm leading-relaxed">
                {searchTerm ? 'Nenhum livro encontrado para sua busca.' : 'Sua biblioteca está vazia. Que tal catalogar seu primeiro livro hoje?'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredBooks.map((book, idx) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    index={idx}
                    searchTerm={searchTerm}
                    onSelect={setSelectedBookId}
                    onUpdateStatus={(id, status) => updateBook(id, { status })}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && <AddBookModal onAdd={addBook} onClose={() => setIsAdding(false)} />}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/Sidebar.tsx components/LibraryClient.tsx
git commit -m "feat: add Sidebar and LibraryClient components"
```

---

## Task 13: Main Page (Server Component)

**Files:**
- Modify: `app/(app)/page.tsx`

- [ ] **Step 1: Criar app/(app)/page.tsx**

```typescript
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import LibraryClient from '@/components/LibraryClient';
import type { Book } from '@/types';

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const rawBooks = await prisma.book.findMany({
    where: { userId: session.user.id },
    include: { annotations: { orderBy: { createdAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  });

  // Serializa Dates para string (JSON-safe)
  const books: Book[] = rawBooks.map((b) => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
    annotations: b.annotations.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  }));

  const name = session.user.name ?? '';
  const userInitials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <LibraryClient
      initialBooks={books}
      userInitials={userInitials}
      userImage={session.user.image}
    />
  );
}
```

- [ ] **Step 2: Rodar toda a suíte de testes para garantir que nada quebrou**

```bash
npx vitest run
```

Expected: todos os testes passam.

- [ ] **Step 3: Commit**

```bash
git add app/
git commit -m "feat: add main Server Component page with Prisma data fetching"
```

---

## Task 14: Migração do banco de dados + Smoke Test

**Files:**
- `prisma/schema.prisma` (já existe)
- `.env.local` (configurar DATABASE_URL real)

- [ ] **Step 1: Configurar DATABASE_URL real em .env.local**

Opção A — Neon (recomendado, gratuito):
1. Criar conta em neon.tech
2. Criar projeto "libros"
3. Copiar a connection string para DATABASE_URL em `.env.local`

Opção B — Local com Docker:
```bash
docker run --name libros-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=libros -p 5432:5432 -d postgres
```
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/libros"
```

- [ ] **Step 2: Configurar Google OAuth**

1. Ir para console.cloud.google.com
2. Criar projeto → APIs & Services → Credentials → OAuth 2.0 Client ID
3. Tipo: Web Application
4. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copiar Client ID e Client Secret para `.env.local`
6. Gerar AUTH_SECRET:
```bash
openssl rand -base64 32
```

- [ ] **Step 3: Rodar a migration do banco**

```bash
npx prisma migrate dev --name init
```

Expected:
```
✔ Generated Prisma Client
✔ Applied migration `20260514000000_init`
```

- [ ] **Step 4: Iniciar o servidor de desenvolvimento**

```bash
npm run dev
```

Expected: "Ready - started server on 0.0.0.0:3000"

- [ ] **Step 5: Smoke test manual**

Abrir http://localhost:3000 e verificar:
- [ ] Redireciona para `/login`
- [ ] Botão "Entrar com Google" aparece com o estilo correto
- [ ] Login com Google funciona e redireciona para `/`
- [ ] Página principal carrega sem erros (biblioteca vazia)
- [ ] Botão "Adicionar" abre o modal
- [ ] Adicionar um livro → aparece na lista
- [ ] Clicar no livro → abre detalhe
- [ ] Adicionar anotação → aparece na lista
- [ ] Deletar anotação → some da lista
- [ ] Mudar status → badge atualiza
- [ ] Rating funciona
- [ ] Busca filtra corretamente
- [ ] Filtros da sidebar funcionam
- [ ] "Compactar Biblioteca" exporta corretamente

- [ ] **Step 6: Commit final**

```bash
git add .
git commit -m "feat: complete Libros Next.js migration with auth and PostgreSQL"
```
