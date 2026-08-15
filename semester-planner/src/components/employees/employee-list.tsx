'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveOperator } from '@/server/actions/personnel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';

interface ListOperator {
  id: string;
  name: string;
  shift: string;
  active: boolean;
  iconColor: string | null;
  certifications: string[];
}

interface ListProcess {
  id: string;
  name: string;
}

interface EditorState {
  id?: string;
  name: string;
  shift: string;
  active: boolean;
  iconColor: string;
}

const ICON_COLORS = ['#7c6bff', '#34e0ff', '#46f2a9', '#ffd84d', '#ff4d7d', '#b58cff', '#4dc9ff', '#ff9d2e'];

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (
    words.length >= 2 ? `${words[0]![0]}${words[1]![0]}` : (words[0]?.slice(0, 2) ?? '?')
  ).toUpperCase();
}

export function EmployeeList({
  operators,
  processes,
  shifts,
  canEdit,
}: {
  operators: ListOperator[];
  processes: ListProcess[];
  shifts: string[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processName = useMemo(() => new Map(processes.map((p) => [p.id, p.name])), [processes]);

  // Search matches operator name OR any certified process name.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return operators;
    return operators.filter(
      (op) =>
        op.name.toLowerCase().includes(q) ||
        op.certifications.some((id) => processName.get(id)?.toLowerCase().includes(q)),
    );
  }, [operators, query, processName]);

  const save = () => {
    if (!editor) return;
    const payload = { ...editor, name: editor.name.trim() };
    if (!payload.name) return;
    setEditor(null);
    setError(null);
    startTransition(async () => {
      const result = await saveOperator(payload);
      if (!result.ok) setError(result.error ?? 'Kunde inte spara');
      else router.refresh();
    });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-xl font-extrabold">Medarbetare</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sök på namn eller certifiering…"
          aria-label="Sök medarbetare på namn eller certifiering"
          className="min-w-64 flex-1 rounded-md border border-line bg-panel px-3 py-1.5 text-sm transition-shadow duration-(--motion-base) focus:shadow-glow-accent"
        />
        {canEdit && (
          <Button
            onClick={() =>
              setEditor({ name: '', shift: shifts[0] ?? 'S1', active: true, iconColor: ICON_COLORS[0]! })
            }
          >
            Ny operatör
          </Button>
        )}
        {error && (
          <span role="alert" className="rounded-md border border-alert px-3 py-1 text-sm font-semibold text-alert">
            {error}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((op) => (
          <Panel key={op.id} className={`flex items-center gap-3 p-3 ${op.active ? '' : 'opacity-60'}`}>
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill text-xs font-bold text-ink-inverse"
              style={{ backgroundColor: op.iconColor ?? 'var(--accent)' }}
            >
              {initials(op.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold">{op.name}</span>
                <Badge tone="muted">{op.shift}</Badge>
                {!op.active && <Badge tone="alert">Inaktiv</Badge>}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {op.certifications.length ? (
                  op.certifications.map((id) => (
                    <Badge key={id} tone="accent">
                      {processName.get(id) ?? id}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-ink-muted">Inga certifieringar</span>
                )}
              </div>
            </div>
            {canEdit && (
              <Button
                variant="secondary"
                onClick={() =>
                  setEditor({
                    id: op.id,
                    name: op.name,
                    shift: op.shift,
                    active: op.active,
                    iconColor: op.iconColor ?? ICON_COLORS[0]!,
                  })
                }
              >
                Redigera
              </Button>
            )}
          </Panel>
        ))}
        {filtered.length === 0 && (
          <Panel className="text-center text-sm text-ink-muted">Inga träffar för ”{query}”.</Panel>
        )}
      </div>

      {editor && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editor.id ? 'Redigera operatör' : 'Ny operatör'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70 p-4"
          onKeyDown={(e) => e.key === 'Escape' && setEditor(null)}
        >
          <div className="w-full max-w-sm rounded-lg border border-line bg-panel p-5 shadow-pop">
            <h2 className="font-heading text-lg font-extrabold">
              {editor.id ? 'Redigera operatör' : 'Ny operatör'}
            </h2>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-ink-muted">Namn</span>
                <input
                  autoFocus
                  value={editor.name}
                  onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                  className="rounded-md border border-line bg-bg-2 px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-ink-muted">Skift</span>
                <select
                  value={editor.shift}
                  onChange={(e) => setEditor({ ...editor, shift: e.target.value })}
                  className="rounded-md border border-line bg-bg-2 px-2 py-1.5"
                >
                  {shifts.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="flex flex-col gap-1">
                <legend className="text-ink-muted">Ikonfärg</legend>
                <div className="flex gap-1.5">
                  {ICON_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Färg ${c}`}
                      aria-pressed={editor.iconColor === c}
                      onClick={() => setEditor({ ...editor, iconColor: c })}
                      className={`h-7 w-7 rounded-pill border-2 transition-transform duration-(--motion-fast) ease-(--ease-spring) hover:scale-110 ${
                        editor.iconColor === c ? 'border-ink shadow-glow-accent' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </fieldset>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editor.active}
                  onChange={(e) => setEditor({ ...editor, active: e.target.checked })}
                />
                <span>Aktiv (räknas i bemanning och täckning)</span>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditor(null)}>
                Avbryt
              </Button>
              <Button onClick={save} disabled={!editor.name.trim()}>
                Spara
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
