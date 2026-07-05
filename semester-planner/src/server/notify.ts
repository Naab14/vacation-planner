import { Role } from '@prisma/client';
import { db } from '@/lib/db';

export type NotificationType = 'request.submitted' | 'request.decided' | 'coverage.risk';

export interface NotificationPayload extends Record<string, unknown> {
  title: string;
  body?: string;
  href?: string;
}

/** In-app notification for one user. Email delivery is layered on in phase 5 (env-gated). */
export async function notifyUser(orgId: string, userId: string, type: NotificationType, payload: NotificationPayload) {
  await db.notification.create({ data: { orgId, userId, type, payload: JSON.parse(JSON.stringify(payload)) } });
}

/** Notify every manager and admin in the org (e.g. a new leave request). */
export async function notifyManagers(orgId: string, type: NotificationType, payload: NotificationPayload) {
  const managers = await db.user.findMany({
    where: { orgId, role: { in: [Role.MANAGER, Role.ADMIN] } },
    select: { id: true },
  });
  if (!managers.length) return;
  await db.notification.createMany({
    data: managers.map((m) => ({ orgId, userId: m.id, type, payload: JSON.parse(JSON.stringify(payload)) })),
  });
}
