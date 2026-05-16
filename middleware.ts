import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/((?!api/auth|api/books|api/stripe|api/recommendations|_next/static|_next/image|favicon.ico).*)'],
};
