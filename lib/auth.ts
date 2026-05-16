import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
        token.picture = user.image ?? token.picture;
      }

      // Query DB on every jwt callback (both initial sign-in and token refresh)
      // to keep isPremium fresh within a single navigation.
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { stripeCurrentPeriodEnd: true },
        });
        const periodEnd = dbUser?.stripeCurrentPeriodEnd ?? new Date(0);
        token.isPremium = periodEnd > new Date();
      } else {
        token.isPremium = false;
      }

      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.name) session.user.name = token.name;
      if (token.email) session.user.email = token.email;
      if (token.picture) session.user.image = token.picture as string;
      session.user.isPremium = token.isPremium as boolean ?? false;
      return session;
    },
  },
});
