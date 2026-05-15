import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export const authConfig = {
  providers: [Google],
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' as const },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      if (isLoggedIn && nextUrl.pathname === '/login') {
        return Response.redirect(new URL('/', nextUrl));
      }
      if (!isLoggedIn && nextUrl.pathname !== '/login') {
        return Response.redirect(new URL('/login', nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
