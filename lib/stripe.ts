// IMPORTANT: This file uses Node.js built-ins and must NEVER be imported from
// lib/auth.config.ts or middleware.ts (both run in the Edge runtime).
// Stripe logic belongs exclusively in lib/auth.ts, lib/stripe.ts, and app/api/stripe/* routes.

import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});
