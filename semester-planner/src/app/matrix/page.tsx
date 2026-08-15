import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { AppHeader } from '@/components/app-header';
import { CertificationMatrix } from '@/components/matrix/certification-matrix';

export const dynamic = 'force-dynamic';

export default async function MatrixPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const { orgId, role } = session.user;
  const canEdit = role === Role.MANAGER || role === Role.ADMIN;

  const [operators, processes] = await Promise.all([
    db.operator.findMany({
      where: { orgId },
      include: { certifications: { select: { processId: true } } },
      orderBy: [{ shift: 'asc' }, { name: 'asc' }],
    }),
    db.process.findMany({ where: { orgId }, orderBy: { sortOrder: 'asc' } }),
  ]);

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader active="/matrix" role={role} email={session.user.email ?? ''} userId={session.user.id} />
      <main className="p-4">
        <CertificationMatrix
          operators={operators.map((op) => ({
            id: op.id,
            name: op.name,
            shift: op.shift,
            active: op.active,
            iconColor: op.iconColor,
            certifications: op.certifications.map((c) => c.processId),
          }))}
          processes={processes.map((p) => ({ id: p.id, name: p.name }))}
          canEdit={canEdit}
        />
      </main>
    </div>
  );
}
