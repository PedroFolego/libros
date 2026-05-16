import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const sub = await stripe.subscriptions.retrieve(session.subscription as string);
    await prisma.user.update({
      where: { stripeCustomerId: session.customer as string },
      data: {
        stripeSubscriptionId: sub.id,
        stripePriceId: sub.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
      },
    });
  } else if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription;
    await prisma.user.update({
      where: { stripeCustomerId: sub.customer as string },
      data: {
        stripeSubscriptionId: sub.id,
        stripePriceId: sub.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
      },
    });
  } else if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    await prisma.user.update({
      where: { stripeCustomerId: sub.customer as string },
      data: {
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
      },
    });
  }

  return NextResponse.json({ received: true });
}
