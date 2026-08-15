import type { NextAuthConfig } from 'next-auth';
import type { Role } from '@prisma/client';

/**
 * Edge-safe Auth.js config (no Prisma, no argon2) — shared by the middleware.
 * The Credentials provider is added in src/auth.ts, which only runs in Node.
 */
export const authConfig = {
  // Vercel sets the host automatically; self-hosted/dev deployments sit behind
  // their own proxy, so the Host header is trusted everywhere we run.
  trustHost: true,
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isLogin = request.nextUrl.pathname.startsWith('/login');
      if (isLogin) return true;
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.operatorId = user.operatorId;
        token.orgId = user.orgId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as Role;
        session.user.operatorId = (token.operatorId as string | null) ?? null;
        session.user.orgId = token.orgId as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

declare module 'next-auth' {
  interface User {
    role: Role;
    operatorId: string | null;
    orgId: string;
  }
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role: Role;
      operatorId: string | null;
      orgId: string;
    };
  }
}
