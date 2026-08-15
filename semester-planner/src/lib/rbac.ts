import { Role } from '@prisma/client';
import { auth } from '@/auth';
import type { Session } from 'next-auth';

const RANK: Record<Role, number> = {
  [Role.EMPLOYEE]: 0,
  [Role.MANAGER]: 1,
  [Role.ADMIN]: 2,
};

export class AuthorizationError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

/** Every server action / route handler starts here. Throws on failure. */
export async function requireRole(minimum: Role): Promise<Session> {
  const session = await auth();
  if (!session?.user) throw new AuthorizationError('Not authenticated', 401);
  if (RANK[session.user.role] < RANK[minimum]) {
    throw new AuthorizationError(`Requires ${minimum} role`);
  }
  return session;
}

export const requireUser = () => requireRole(Role.EMPLOYEE);
export const requireManager = () => requireRole(Role.MANAGER);
export const requireAdmin = () => requireRole(Role.ADMIN);

/** Employees may only touch their own operator's data; managers+ touch all. */
export function assertOperatorAccess(session: Session, operatorId: string): void {
  if (RANK[session.user.role] >= RANK[Role.MANAGER]) return;
  if (session.user.operatorId !== operatorId) {
    throw new AuthorizationError('Cannot access another operator');
  }
}
