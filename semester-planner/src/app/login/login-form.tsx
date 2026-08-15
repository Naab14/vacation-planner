'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { loginAction, type LoginState } from './actions';

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <Panel className="shadow-pop">
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-muted">E-post</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-line bg-bg-2 px-3 py-2 text-ink transition-shadow duration-(--motion-base) focus:shadow-glow-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-muted">Lösenord</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-md border border-line bg-bg-2 px-3 py-2 text-ink transition-shadow duration-(--motion-base) focus:shadow-glow-accent"
          />
        </label>
        {state.error ? (
          <p role="alert" className="text-sm font-medium text-alert">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? 'Loggar in…' : 'Logga in'}
        </Button>
      </form>
    </Panel>
  );
}
