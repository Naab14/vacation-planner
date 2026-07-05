import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/');

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="bg-(image:--gradient-hero) bg-clip-text font-heading text-3xl font-black text-transparent">
            Semester Planner
          </h1>
          <p className="mt-2 text-sm text-ink-muted">Skift- och semesterplanering</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
