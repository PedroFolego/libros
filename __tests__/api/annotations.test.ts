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

  it('deleta anotação com escopo do bookId correto', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockFindUnique.mockResolvedValue(livroFixture as any);
    mockDelete.mockResolvedValue({ id: 'a1', content: 'x', createdAt: new Date(), bookId: 'book-1' });
    const req = new Request('http://localhost/api/books/book-1/annotations?annotationId=a1', { method: 'DELETE' });
    await DELETE(req, { params });
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'a1', bookId: 'book-1' } });
  });
});
