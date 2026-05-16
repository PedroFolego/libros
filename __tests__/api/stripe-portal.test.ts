import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    billingPortal: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { POST } from '@/app/api/stripe/portal/route';

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockPortalSessionsCreate = vi.mocked(stripe.billingPortal.sessions.create);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/stripe/portal', () => {
  it('returns 401 when there is no authenticated session', async () => {
    mockAuth.mockResolvedValue(null as any);

    const res = await POST();
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when user has no stripeCustomerId', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockFindUnique.mockResolvedValue({
      id: 'user-1',
      stripeCustomerId: null,
    } as any);

    const res = await POST();
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe('No subscription found');
  });

  it('returns 400 when user is not found in the database', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockFindUnique.mockResolvedValue(null as any);

    const res = await POST();
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe('No subscription found');
  });

  it('returns 200 with portal URL when user has an active subscription', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockFindUnique.mockResolvedValue({
      id: 'user-1',
      stripeCustomerId: 'cus_existing123',
    } as any);
    mockPortalSessionsCreate.mockResolvedValue({
      url: 'https://billing.stripe.com/session/test',
    } as any);

    const res = await POST();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.url).toBe('https://billing.stripe.com/session/test');

    expect(mockPortalSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_existing123' })
    );
  });
});
