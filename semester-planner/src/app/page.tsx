import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { auth, signOut } from '@/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { ThemeToggle } from '@/components/theme-toggle';

const roleTone = {
  [Role.ADMIN]: 'accent',
  [Role.MANAGER]: 'ok',
  [Role.EMPLOYEE]: 'muted',
} as const;

// Role-aware landing. Once /dashboard and /planning exist (phases 2 & 5),
// managers land on /dashboard and employees on their own schedule.
export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const { user } = session;

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-line bg-topbar px-6 py-3 text-topbar-ink">
        <h1 className="font-heading text-lg font-black">Semester Planner</h1>
        <div className="flex items-center gap-3">
          <Badge tone={roleTone[user.role]}>{user.role}</Badge>
          <ThemeToggle />
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/login' });
            }}
          >
            <Button variant="ghost" type="submit">
              Logga ut
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-6">
        <Panel>
          <h2 className="font-heading text-xl font-extrabold">
            Inloggad som {user.email}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            Modulerna byggs fas för fas: planering, certifieringsmatris, ledighetsansökningar,
            översikt och rapporter aktiveras här allteftersom.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="draft">Utkast</Badge>
            <Badge tone="requested">Begärd</Badge>
            <Badge tone="pending">Väntar</Badge>
            <Badge tone="approved">Godkänd</Badge>
            <Badge tone="denied">Nekad</Badge>
          </div>
        </Panel>
      </main>
    </div>
  );
}
