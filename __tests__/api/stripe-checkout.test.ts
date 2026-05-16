import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    customers: {
      create: vi.fn(),
    },
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { POST } from '@/app/api/stripe/checkout/route';

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockUpdate = vi.mocked(prisma.user.update);
const mockCustomersCreate = vi.mocked(stripe.customers.create);
const mockCheckoutSessionsCreate = vi.mocked(stripe.checkout.sessions.create);

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckoutSessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/test' } as any);
});

describe('POST /api/stripe/checkout', () => {
  it('returns 401 when auth() resolves to null', async () => {
    mockAuth.mockResolvedValue(null as any);
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('creates a Stripe customer when user has no stripeCustomerId and returns { url }', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      stripeCustomerId: null,
    } as any);
    mockCustomersCreate.mockResolvedValue({ id: 'cus_new123' } as any);
    mockUpdate.mockResolvedValue({} as any);

    const res = await POST();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.url).toBe('https://checkout.stripe.com/test');

    expect(mockCustomersCreate).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { stripeCustomerId: 'cus_new123' },
    });
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_new123', mode: 'subscription' })
    );
  });

  it('does NOT call stripe.customers.create when user already has a stripeCustomerId', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      stripeCustomerId: 'cus_existing456',
    } as any);

    const res = await POST();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.url).toBe('https://checkout.stripe.com/test');

    expect(mockCustomersCreate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_existing456' })
    );
  });
});
