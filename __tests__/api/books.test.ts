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
