import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { POST } from '@/app/api/stripe/webhook/route';

const mockConstructEvent = vi.mocked(stripe.webhooks.constructEvent);
const mockSubscriptionsRetrieve = vi.mocked(stripe.subscriptions.retrieve);
const mockUpdate = vi.mocked(prisma.user.update);

function makeRequest(body: string, sig = 'valid-sig') {
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': sig },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdate.mockResolvedValue({} as any);
});

describe('POST /api/stripe/webhook', () => {
  it('returns 400 when constructEvent throws a signature verification error', async () => {
    mockConstructEvent.mockImplementation(() => {
      const err = new Error('Webhook signature verification failed') as Error & { type?: string };
      err.type = 'StripeSignatureVerificationError';
      throw err;
    });

    const req = makeRequest('{"type":"checkout.session.completed"}');
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid signature');
  });

  it('handles checkout.session.completed: retrieves subscription and updates user', async () => {
    const mockSub = {
      id: 'sub_123',
      current_period_end: 1900000000,
      items: { data: [{ price: { id: 'price_abc' } }] },
    };
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          subscription: 'sub_123',
          customer: 'cus_123',
        },
      },
    } as any);
    mockSubscriptionsRetrieve.mockResolvedValue(mockSub as any);

    const req = makeRequest('{}');
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockSubscriptionsRetrieve).toHaveBeenCalledWith('sub_123');
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { stripeCustomerId: 'cus_123' },
      data: {
        stripeSubscriptionId: 'sub_123',
        stripePriceId: 'price_abc',
        stripeCurrentPeriodEnd: new Date(1900000000 * 1000),
      },
    });

    const data = await res.json();
    expect(data.received).toBe(true);
  });

  it('handles customer.subscription.updated: updates user with new period end', async () => {
    const mockSub = {
      id: 'sub_456',
      customer: 'cus_456',
      current_period_end: 1950000000,
      items: { data: [{ price: { id: 'price_def' } }] },
    };
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: mockSub },
    } as any);

    const req = makeRequest('{}');
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { stripeCustomerId: 'cus_456' },
      data: {
        stripeSubscriptionId: 'sub_456',
        stripePriceId: 'price_def',
        stripeCurrentPeriodEnd: new Date(1950000000 * 1000),
      },
    });
  });

  it('handles customer.subscription.deleted: nullifies subscription fields', async () => {
    const mockSub = {
      id: 'sub_789',
      customer: 'cus_789',
    };
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: mockSub },
    } as any);

    const req = makeRequest('{}');
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { stripeCustomerId: 'cus_789' },
      data: {
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
      },
    });
  });

  it('does NOT call prisma.user.update for unknown event types and returns 200', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'invoice.payment_succeeded',
      data: { object: {} },
    } as any);

    const req = makeRequest('{}');
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockUpdate).not.toHaveBeenCalled();
    const data = await res.json();
    expect(data.received).toBe(true);
  });
});
