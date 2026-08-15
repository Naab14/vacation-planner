import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

// Edge middleware: session-cookie gate only. Real authorization (roles) is
// enforced server-side in every page/action via src/lib/rbac.ts.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // API routes are excluded: they authenticate via requireRole() and must
  // return JSON 401/403, not a login redirect.
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico)$).*)'],
};
