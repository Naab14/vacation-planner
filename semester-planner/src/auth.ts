import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { authConfig } from '@/auth.config';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

const credentialsSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        if (!checkRateLimit(`login:${email}`)) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await verifyPassword(user.passwordHash, password);
        if (!valid) return null;

        resetRateLimit(`login:${email}`);
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          operatorId: user.operatorId,
          orgId: user.orgId,
        };
      },
    }),
  ],
});
