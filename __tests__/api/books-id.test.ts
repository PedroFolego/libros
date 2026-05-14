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
