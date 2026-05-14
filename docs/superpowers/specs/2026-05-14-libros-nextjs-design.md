# Libros — Migração para Next.js

**Data:** 2026-05-14
**Status:** Aprovado

## Objetivo

Migrar o app Libros (Vite + React SPA) para Next.js 15 com autenticação por Google (NextAuth.js v5) e persistência real em PostgreSQL via Prisma. O objetivo principal é suportar múltiplos usuários, cada um com sua própria biblioteca.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Auth | NextAuth.js v5 (Auth.js) |
| Banco de dados | PostgreSQL (Neon ou Supabase) |
| ORM | Prisma |
| Estilização | Tailwind CSS v4 |
| Ícones | lucide-react |
| Animações | motion/react |
| Linguagem | TypeScript |

## Abordagem de Migração

Substituição limpa: o projeto Vite atual é substituído por um projeto Next.js no mesmo diretório. O git preserva o histórico. Os componentes e tipos existentes são reaproveitados diretamente.

## Estrutura de Pastas

```
libros/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx              # Tela de login com botão Google
│   ├── (app)/
│   │   ├── layout.tsx                # Layout autenticado (nav + sidebar)
│   │   └── page.tsx                  # Página principal da biblioteca
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts          # Handler NextAuth
│   │   └── books/
│   │       ├── route.ts              # GET (lista), POST (criar livro)
│   │       └── [id]/
│   │           ├── route.ts          # PUT (atualizar), DELETE (remover)
│   │           └── annotations/
│   │               └── route.ts      # POST (criar), DELETE (remover anotação)
│   ├── layout.tsx                    # Root layout com SessionProvider
│   └── globals.css
├── components/
│   ├── Sidebar.tsx                   # Filtros + contador de lidos
│   ├── BookCard.tsx                  # Card individual (compact e featured)
│   ├── BookDetail.tsx                # Visão detalhada do livro + anotações
│   ├── AddBookModal.tsx              # Modal de adicionar livro
│   └── Rating.tsx                    # Componente de estrelas
├── lib/
│   ├── auth.ts                       # Configuração NextAuth
│   └── prisma.ts                     # Singleton do Prisma client
├── prisma/
│   └── schema.prisma
├── types.ts                          # Tipos compartilhados (Book, Annotation, BookStatus)
├── middleware.ts                     # Protege rotas autenticadas
├── next.config.ts
└── tailwind.config.ts
```

## Banco de Dados

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  image     String?
  books     Book[]
  accounts  Account[]
  sessions  Session[]
}

model Book {
  id          String       @id @default(cuid())
  title       String
  author      String
  status      String       // 'reading' | 'want-to-read' | 'finished'
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
```

Os modelos NextAuth (Account, Session, VerificationToken) são gerados pelo adaptador `@auth/prisma-adapter`.

## Autenticação

- Provider: Google OAuth
- Proteção: `middleware.ts` redireciona para `/login` qualquer rota fora de `/login` e `/api/auth/*` para usuários não autenticados
- `SessionProvider` envolve o app no root layout para que componentes client possam acessar a sessão com `useSession()`
- O `userId` da sessão é usado em todas as queries para garantir isolamento de dados entre usuários

## Fluxo de Dados

### Leitura (Server Components)
A página principal `(app)/page.tsx` é um Server Component. Ela chama o Prisma diretamente (sem fetch) para buscar os livros do usuário autenticado, garantindo performance máxima e sem waterfall de rede.

### Escrita (API Routes + Client Components)
Mutações são feitas por componentes client via `fetch` para as API routes:
- `POST /api/books` — adicionar livro
- `PUT /api/books/[id]` — atualizar status ou rating
- `DELETE /api/books/[id]` — remover livro
- `POST /api/books/[id]/annotations` — adicionar anotação
- `DELETE /api/books/[id]/annotations?annotationId=...` — remover anotação

Após cada mutação, o cliente chama `router.refresh()` para revalidar os dados do Server Component sem reload completo.

### Isolamento de dados
Todas as API routes verificam que o `book.userId === session.user.id` antes de qualquer escrita ou leitura. Livros de outros usuários são inacessíveis.

## Componentes

| Componente | Tipo | Descrição |
|---|---|---|
| `(app)/page.tsx` | Server | Busca livros no Prisma, passa para BookList |
| `Sidebar` | Client | Filtros, contadores, exportar |
| `BookCard` | Client | Card featured e compact, ações de status |
| `BookDetail` | Client | Detalhe do livro, anotações, rating |
| `AddBookModal` | Client | Modal de cadastro de livro |
| `Rating` | Client | Estrelas interativas |

Os componentes existentes são reaproveitados com mínimas alterações: substituição de `localStorage` por props/callbacks e adição de `'use client'` onde necessário.

## UI

A interface não muda visualmente. O único componente novo é a tela de login `/login` com:
- Logo Libros
- Botão "Entrar com Google"
- Design consistente com o tema atual (brand colors, tipografia)

## Variáveis de Ambiente

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<gerar com openssl rand -base64 32>

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Banco de dados
DATABASE_URL=postgresql://...
```

## Tratamento de Erros

- API routes retornam `401` se o usuário não está autenticado
- API routes retornam `403` se o usuário tenta acessar recurso de outro usuário
- API routes retornam `404` se o recurso não existe
- Erros de Prisma são capturados e retornam `500` com mensagem genérica (sem expor detalhes internos)

## O que NÃO está no escopo

- Migração automática do localStorage para o banco (usuário começa com biblioteca vazia)
- Página de perfil ou configurações de conta
- Compartilhamento público da biblioteca
- Paginação (mantém comportamento atual de listar tudo)
