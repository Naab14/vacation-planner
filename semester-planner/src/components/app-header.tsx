import Link from 'next/link';
import { Role } from '@prisma/client';
import { signOut } from '@/auth';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

const roleTone = {
  [Role.ADMIN]: 'accent',
  [Role.MANAGER]: 'ok',
  [Role.EMPLOYEE]: 'muted',
} as const;

// Modules appear here as their phases land.
const NAV: Array<{ href: string; label: string; minRole: Role[] }> = [
  { href: '/planning', label: 'Planering', minRole: [Role.ADMIN, Role.MANAGER, Role.EMPLOYEE] },
  { href: '/matrix', label: 'Matris', minRole: [Role.ADMIN, Role.MANAGER, Role.EMPLOYEE] },
  { href: '/employees', label: 'Medarbetare', minRole: [Role.ADMIN, Role.MANAGER] },
  { href: '/requests', label: 'Ansökningar', minRole: [Role.ADMIN, Role.MANAGER, Role.EMPLOYEE] },
];

export async function AppHeader({
  active,
  role,
  email,
  userId,
}: {
  active: string;
  role: Role;
  email: string;
  userId?: string;
}) {
  const unread = userId
    ? await db.notification.count({ where: { userId, readAt: null } })
    : 0;
  return (
    <header className="flex items-center justify-between border-b border-line bg-topbar px-4 py-2.5 text-topbar-ink">
      <div className="flex items-center gap-5">
        <Link href="/" className="font-heading text-lg font-black">
          Semester Planner
        </Link>
        <nav className="flex items-center gap-1" aria-label="Huvudmeny">
          {NAV.filter((item) => item.minRole.includes(role)).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active === item.href ? 'page' : undefined}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-[box-shadow,color] duration-(--motion-base) ${
                active === item.href
                  ? 'text-topbar-ink shadow-glow-accent'
                  : 'text-topbar-ink/60 hover:text-topbar-ink'
              }`}
            >
              {item.label}
              {item.href === '/requests' && unread > 0 ? (
                <span
                  aria-label={`${unread} olästa notiser`}
                  className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-pill bg-accent px-1 font-mono text-[10px] font-bold text-ink-inverse shadow-glow-accent"
                >
                  {unread}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-topbar-ink/60 sm:inline">{email}</span>
        <Badge tone={roleTone[role]}>{role}</Badge>
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
  );
}
