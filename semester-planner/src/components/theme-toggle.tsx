'use client';

import { useCallback, useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    if (current === 'light' || current === 'dark') setTheme(current);
  }, []);

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('sp-theme', next);
    } catch {
      // storage unavailable (private mode) — theme still applies for the session
    }
    setTheme(next);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Byt till ljust tema' : 'Byt till mörkt tema'}
      className="rounded-md border border-line bg-panel px-3 py-1.5 text-sm text-ink-muted transition-[box-shadow,transform] duration-(--motion-base) ease-(--ease-spring) hover:text-ink hover:shadow-glow-accent"
    >
      {theme === 'dark' ? '☀︎' : '☾'}
    </button>
  );
}
