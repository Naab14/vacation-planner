'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import {
  cancelLeaveRequest,
  decideLeaveRequest,
  markNotificationsRead,
  submitLeaveRequest,
} from '@/server/actions/requests';

export interface RequestItem {
  id: string;
  operatorName: string;
  operatorShift: string;
  startWeek: number;
  endWeek: number;
  status: string;
  note: string | null;
  createdAt: string;
  warnings: string[];
  events: Array<{ decision: string; comment: string | null; by: string; at: string }>;
  own: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  at: string;
}

const STATUS_TONE: Record<string, 'draft' | 'requested' | 'pending' | 'approved' | 'denied' | 'muted'> = {
  DRAFT: 'draft',
  REQUESTED: 'requested',
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Utkast',
  REQUESTED: 'Begärd',
  PENDING: 'Väntar',
  APPROVED: 'Godkänd',
  DENIED: 'Nekad',
};

const DECISION_LABEL: Record<string, string> = {
  SUBMITTED: 'skickade in',
  APPROVED: 'godkände',
  DENIED: 'nekade',
  CANCELLED: 'återkallade',
};

function fmt(at: string) {
  return new Date(at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });
}

export function RequestsView({
  items,
  isManager,
  canSubmit,
  year,
  notifications,
}: {
  items: RequestItem[];
  isManager: boolean;
  canSubmit: boolean;
  year: number;
  notifications: NotificationItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ startWeek: 25, endWeek: 27, note: '' });
  const [comments, setComments] = useState<Record<string, string>>({});

  const open = items.filter((i) => i.status === 'REQUESTED' || i.status === 'PENDING');
  const closed = items.filter((i) => i.status !== 'REQUESTED' && i.status !== 'PENDING');
  const unread = notifications.filter((n) => !n.read);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.error ?? 'Något gick fel');
      else router.refresh();
    });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-xl font-extrabold">Ledighetsansökningar {year}</h1>
        {error && (
          <span role="alert" className="rounded-md border border-alert px-3 py-1 text-sm font-semibold text-alert">
            {error}
          </span>
        )}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Panel className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-extrabold">
              Notiser {unread.length > 0 && <Badge tone="accent">{unread.length} olästa</Badge>}
            </h2>
            {unread.length > 0 && (
              <button
                type="button"
                className="text-xs text-accent-2 hover:underline"
                onClick={() => run(markNotificationsRead)}
              >
                markera som lästa
              </button>
            )}
          </div>
          <ul className="mt-2 flex flex-col gap-1">
            {notifications.slice(0, 6).map((n) => (
              <li key={n.id} className={`text-sm ${n.read ? 'text-ink-muted' : 'font-semibold'}`}>
                {!n.read && <span aria-hidden className="mr-1 text-accent">●</span>}
                {n.title}
                {n.body ? <span className="text-ink-muted"> — {n.body}</span> : null}
                <span className="ml-2 font-mono text-[11px] text-ink-muted">{fmt(n.at)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Submit form */}
      {canSubmit && (
        <Panel className="p-4">
          <h2 className="font-heading text-sm font-extrabold">Ny ansökan</h2>
          <form
            className="mt-3 flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              run(() =>
                submitLeaveRequest({
                  year,
                  startWeek: form.startWeek,
                  endWeek: form.endWeek,
                  note: form.note || undefined,
                }),
              );
            }}
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-muted">Från vecka</span>
              <input
                type="number"
                min={1}
                max={53}
                value={form.startWeek}
                onChange={(e) => setForm({ ...form, startWeek: Number(e.target.value) })}
                className="w-24 rounded-md border border-line bg-bg-2 px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-muted">Till vecka</span>
              <input
                type="number"
                min={1}
                max={53}
                value={form.endWeek}
                onChange={(e) => setForm({ ...form, endWeek: Number(e.target.value) })}
                className="w-24 rounded-md border border-line bg-bg-2 px-2 py-1.5"
              />
            </label>
            <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
              <span className="text-ink-muted">Kommentar (valfri)</span>
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="rounded-md border border-line bg-bg-2 px-2 py-1.5"
              />
            </label>
            <Button type="submit" disabled={pending}>
              Skicka ansökan
            </Button>
          </form>
        </Panel>
      )}

      {/* Open requests */}
      <section aria-label="Öppna ansökningar" className="flex flex-col gap-2">
        <h2 className="font-heading text-sm font-extrabold text-ink-muted">
          Att hantera ({open.length})
        </h2>
        {open.length === 0 && <Panel className="p-4 text-sm text-ink-muted">Inga öppna ansökningar.</Panel>}
        {open.map((item) => (
          <Panel key={item.id} className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{item.operatorName}</span>
              <Badge tone="muted">{item.operatorShift}</Badge>
              <span className="font-mono text-sm">
                v.{item.startWeek}–{item.endWeek}
              </span>
              <Badge tone={STATUS_TONE[item.status] ?? 'muted'}>{STATUS_LABEL[item.status] ?? item.status}</Badge>
              <span className="ml-auto font-mono text-[11px] text-ink-muted">{fmt(item.createdAt)}</span>
            </div>
            {item.note && <p className="mt-1 text-sm text-ink-muted">”{item.note}”</p>}

            {item.warnings.length > 0 ? (
              <ul className="mt-2 rounded-md border border-coverage-yellow/60 bg-bg-2 p-2 text-xs text-coverage-yellow">
                {item.warnings.slice(0, 4).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-ok">Ingen påverkan på täckning eller regler vid godkännande.</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {isManager && (
                <>
                  <input
                    value={comments[item.id] ?? ''}
                    onChange={(e) => setComments({ ...comments, [item.id]: e.target.value })}
                    placeholder="Kommentar…"
                    aria-label={`Kommentar till beslut för ${item.operatorName}`}
                    className="min-w-40 flex-1 rounded-md border border-line bg-bg-2 px-2 py-1.5 text-sm"
                  />
                  <Button
                    disabled={pending}
                    onClick={() =>
                      run(() =>
                        decideLeaveRequest({ blockId: item.id, decision: 'APPROVED', comment: comments[item.id] || undefined }),
                      )
                    }
                  >
                    Godkänn
                  </Button>
                  <Button
                    variant="danger"
                    disabled={pending}
                    onClick={() =>
                      run(() =>
                        decideLeaveRequest({ blockId: item.id, decision: 'DENIED', comment: comments[item.id] || undefined }),
                      )
                    }
                  >
                    Neka
                  </Button>
                </>
              )}
              {(item.own || isManager) && (
                <Button
                  variant="ghost"
                  disabled={pending}
                  onClick={() => run(() => cancelLeaveRequest({ blockId: item.id }))}
                >
                  Återkalla
                </Button>
              )}
            </div>
          </Panel>
        ))}
      </section>

      {/* History */}
      <section aria-label="Historik" className="flex flex-col gap-2">
        <h2 className="font-heading text-sm font-extrabold text-ink-muted">Historik ({closed.length})</h2>
        {closed.map((item) => (
          <Panel key={item.id} className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{item.operatorName}</span>
              <span className="font-mono text-sm">
                v.{item.startWeek}–{item.endWeek}
              </span>
              <Badge tone={STATUS_TONE[item.status] ?? 'muted'}>{STATUS_LABEL[item.status] ?? item.status}</Badge>
            </div>
            <ol className="mt-2 flex flex-col gap-0.5 border-l-2 border-line pl-3 text-xs text-ink-muted">
              {item.events.map((e, i) => (
                <li key={i}>
                  <span className="font-mono">{fmt(e.at)}</span> — {e.by} {DECISION_LABEL[e.decision] ?? e.decision}
                  {e.comment ? <> : ”{e.comment}”</> : null}
                </li>
              ))}
            </ol>
          </Panel>
        ))}
      </section>
    </div>
  );
}
