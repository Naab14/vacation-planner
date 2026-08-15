import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { loadPlanningData } from '@/server/data/planning';
import { PlanningBoard } from '@/components/planning/planning-board';
import { AppHeader } from '@/components/app-header';

export const dynamic = 'force-dynamic';

export default async function PlanningPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const { orgId, role } = session.user;

  const settings = await db.settings.findUniqueOrThrow({ where: { orgId } });
  const data = await loadPlanningData(orgId, settings.planningYear);

  const canEdit = role === Role.MANAGER || role === Role.ADMIN;

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader active="/planning" role={role} email={session.user.email ?? ''} userId={session.user.id} />
      <main className="p-4">
        <PlanningBoard data={data} canEdit={canEdit} isAdmin={role === Role.ADMIN} />
      </main>
    </div>
  );
}
