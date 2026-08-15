import { Role } from '@prisma/client';
import { db } from '@/lib/db';
import { emailEnabled, sendEmail } from '@/server/email';

export type NotificationType = 'request.submitted' | 'request.decided' | 'coverage.risk';

export interface NotificationPayload extends Record<string, unknown> {
  title: string;
  body?: string;
  href?: string;
}

async function emailUsers(userIds: string[], payload: NotificationPayload) {
  if (!emailEnabled() || userIds.length === 0) return;
  const users = await db.user.findMany({
    where: { id: { in: userIds }, email: { not: '' } },
    select: { email: true },
  });
  await sendEmail({
    to: users.map((u) => u.email),
    subject: payload.title,
    text: payload.body ?? payload.title,
  });
}

/** In-app notification for one user; mirrored to email when RESEND_API_KEY is set. */
export async function notifyUser(orgId: string, userId: string, type: NotificationType, payload: NotificationPayload) {
  await db.notification.create({ data: { orgId, userId, type, payload: JSON.parse(JSON.stringify(payload)) } });
  await emailUsers([userId], payload);
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
  await emailUsers(managers.map((m) => m.id), payload);
}
