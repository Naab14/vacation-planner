import type { HTMLAttributes } from 'react';

type Tone = 'accent' | 'ok' | 'alert' | 'muted' | 'draft' | 'requested' | 'pending' | 'approved' | 'denied';

const tones: Record<Tone, string> = {
  accent: 'bg-accent/15 text-accent border-accent/40',
  ok: 'bg-ok/15 text-ok border-ok/40',
  alert: 'bg-alert/15 text-alert border-alert/40',
  muted: 'bg-raised text-ink-muted border-line',
  draft: 'bg-draft text-ink border-draft-line',
  requested: 'bg-requested text-ink border-requested-line',
  pending: 'bg-pending text-ink border-pending-line',
  approved: 'bg-approved text-ink border-approved-line',
  denied: 'bg-denied text-ink border-denied-line',
};

export function Badge({
  tone = 'muted',
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]} ${className}`}
      {...props}
    />
  );
}
