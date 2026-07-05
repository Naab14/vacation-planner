import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Panel } from '@/components/ui/panel';
import { AppHeader } from '@/components/app-header';

// Role-aware landing. Managers get /dashboard as home once phase 5 lands;
// today everyone starts at the planning board.
export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const { user } = session;

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader active="/" role={user.role} email={user.email ?? ''} userId={user.id} />
      <main className="mx-auto max-w-3xl p-6">
        <Panel>
          <h2 className="font-heading text-xl font-extrabold">Välkommen!</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Gå till{' '}
            <Link href="/planning" className="font-semibold text-accent-2 hover:underline">
              planeringen
            </Link>{' '}
            för att se och planera frånvaro. Fler moduler (certifieringsmatris,
            ledighetsansökningar, översikt, rapporter) aktiveras fas för fas.
          </p>
        </Panel>
      </main>
    </div>
  );
}
