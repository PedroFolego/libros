import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));

import { auth } from '@/lib/auth';
import { POST } from '@/app/api/recommendations/route';

const mockAuth = vi.mocked(auth);

beforeEach(() => vi.clearAllMocks());

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/recommendations', () => {
  it('returns 401 when auth() resolves to null', async () => {
    mockAuth.mockResolvedValue(null as any);
    const req = makeRequest({ books: [{ title: 'Test', author: 'Author', rating: 5 }] });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 403 when session has isPremium: false', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isPremium: false } } as any);
    const req = makeRequest({ books: [{ title: 'Test', author: 'Author', rating: 5 }] });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Premium required');
  });

  it('returns 200 with { prompt: string } when isPremium: true and valid books provided', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isPremium: true } } as any);
    const req = makeRequest({
      books: [
        { title: 'O Alquimista', author: 'Paulo Coelho', rating: 5 },
        { title: 'Sapiens', author: 'Yuval Noah Harari', rating: 4 },
      ],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data.prompt).toBe('string');
    expect(data.prompt.length).toBeGreaterThan(0);
    expect(data.prompt).toContain('O Alquimista');
    expect(data.prompt).toContain('Paulo Coelho');
  });

  it('returns 400 when books array is missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isPremium: true } } as any);
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when books array is empty', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isPremium: true } } as any);
    const req = makeRequest({ books: [] });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
