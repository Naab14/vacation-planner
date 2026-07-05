'use client';

import { Fragment, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createProcess,
  deleteProcess,
  renameProcess,
  setCertification,
} from '@/server/actions/personnel';

interface MatrixOperator {
  id: string;
  name: string;
  shift: string;
  active: boolean;
  iconColor: string | null;
  certifications: string[];
}

interface MatrixProcess {
  id: string;
  name: string;
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (
    words.length >= 2 ? `${words[0]![0]}${words[1]![0]}` : (words[0]?.slice(0, 2) ?? '?')
  ).toUpperCase();
}

export function CertificationMatrix({
  operators,
  processes,
  canEdit,
}: {
  operators: MatrixOperator[];
  processes: MatrixProcess[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newProcess, setNewProcess] = useState('');
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  // operatorId → Set of processIds, optimistic
  const [certs, setCerts] = useState(() => {
    const map = new Map<string, Set<string>>();
    for (const op of operators) map.set(op.id, new Set(op.certifications));
    return map;
  });

  const shifts = useMemo(() => [...new Set(operators.map((o) => o.shift))].sort(), [operators]);

  const toggle = (operatorId: string, processId: string) => {
    if (!canEdit) return;
    const current = certs.get(operatorId) ?? new Set<string>();
    const certified = !current.has(processId);
    setCerts((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(operatorId) ?? []);
      if (certified) set.add(processId);
      else set.delete(processId);
      next.set(operatorId, set);
      return next;
    });
    setError(null);
    startTransition(async () => {
      const result = await setCertification({ operatorId, processId, certified });
      if (!result.ok) {
        // revert
        setCerts((prev) => {
          const next = new Map(prev);
          const set = new Set(next.get(operatorId) ?? []);
          if (certified) set.delete(processId);
          else set.add(processId);
          next.set(operatorId, set);
          return next;
        });
        setError(result.error ?? 'Kunde inte spara');
      } else {
        router.refresh();
      }
    });
  };

  const addProcess = () => {
    const name = newProcess.trim();
    if (!name) return;
    setNewProcess('');
    startTransition(async () => {
      const result = await createProcess({ name });
      if (!result.ok) setError(result.error ?? 'Kunde inte skapa process');
      else router.refresh();
    });
  };

  const commitRename = () => {
    if (!renaming) return;
    const { id, name } = renaming;
    setRenaming(null);
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await renameProcess({ id, name: name.trim() });
      if (!result.ok) setError(result.error ?? 'Kunde inte byta namn');
      else router.refresh();
    });
  };

  const removeProcess = (id: string, name: string) => {
    if (!window.confirm(`Ta bort processen "${name}"? Certifieringar och behov för processen tas också bort.`)) return;
    startTransition(async () => {
      const result = await deleteProcess({ id });
      if (!result.ok) setError(result.error ?? 'Kunde inte ta bort');
      else router.refresh();
    });
  };

  const certCount = (processId: string) =>
    operators.filter((op) => op.active && certs.get(op.id)?.has(processId)).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-xl font-extrabold">Certifieringsmatris</h1>
        {canEdit && (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addProcess();
            }}
          >
            <input
              value={newProcess}
              onChange={(e) => setNewProcess(e.target.value)}
              placeholder="Ny process…"
              aria-label="Namn på ny process"
              className="rounded-md border border-line bg-panel px-3 py-1.5 text-sm transition-shadow duration-(--motion-base) focus:shadow-glow-accent"
            />
            <button
              type="submit"
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-ink-inverse transition-shadow duration-(--motion-base) hover:shadow-glow-accent"
            >
              Lägg till
            </button>
          </form>
        )}
        {error && (
          <span role="alert" className="rounded-md border border-alert px-3 py-1 text-sm font-semibold text-alert">
            {error}
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-panel shadow-panel">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line-strong">
              <th className="px-3 py-2 text-left text-xs font-semibold text-ink-muted">Operatör</th>
              {processes.map((p) => (
                <th key={p.id} className="border-l border-line px-2 py-2 text-center align-bottom">
                  {renaming?.id === p.id ? (
                    <input
                      autoFocus
                      value={renaming.name}
                      aria-label={`Byt namn på ${p.name}`}
                      onChange={(e) => setRenaming({ id: p.id, name: e.target.value })}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                      className="w-28 rounded-md border border-line bg-bg-2 px-1 py-0.5 text-center text-xs"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="max-w-32 truncate text-xs font-semibold">{p.name}</span>
                      <span className="font-mono text-[10px] text-ink-muted">{certCount(p.id)} cert.</span>
                      {canEdit && (
                        <span className="flex gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setRenaming({ id: p.id, name: p.name })}
                            className="text-accent-2 hover:underline"
                          >
                            byt namn
                          </button>
                          <button
                            type="button"
                            onClick={() => removeProcess(p.id, p.name)}
                            className="text-alert hover:underline"
                          >
                            ta bort
                          </button>
                        </span>
                      )}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <Fragment key={shift}>
                <tr className="border-b border-line bg-bg-2">
                  <td colSpan={processes.length + 1} className="px-3 py-1 font-heading text-xs font-extrabold">
                    {shift}
                  </td>
                </tr>
                {operators
                  .filter((op) => op.shift === shift)
                  .map((op) => (
                    <tr key={op.id} className={`border-b border-line/50 ${op.active ? '' : 'opacity-50'}`}>
                      <td className="flex items-center gap-2 px-3 py-1.5">
                        <span
                          aria-hidden
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill text-[10px] font-bold text-ink-inverse"
                          style={{ backgroundColor: op.iconColor ?? 'var(--accent)' }}
                        >
                          {initials(op.name)}
                        </span>
                        <span className="truncate">{op.name}</span>
                        {!op.active && <span className="text-[10px] text-ink-muted">(inaktiv)</span>}
                      </td>
                      {processes.map((p) => {
                        const certified = certs.get(op.id)?.has(p.id) ?? false;
                        return (
                          <td key={p.id} className="border-l border-line/40 text-center">
                            <button
                              type="button"
                              disabled={!canEdit}
                              aria-pressed={certified}
                              aria-label={`${op.name} — ${p.name}: ${certified ? 'certifierad' : 'ej certifierad'}`}
                              onClick={() => toggle(op.id, p.id)}
                              className={`m-1 h-7 w-7 rounded-md border transition-[box-shadow,background-color,transform] duration-(--motion-fast) ease-(--ease-spring) ${
                                certified
                                  ? 'border-approved-line bg-approved font-bold text-ink shadow-glow-ok'
                                  : 'border-line bg-bg-2 text-ink-muted'
                              } ${canEdit ? 'enabled:hover:[transform:var(--lift-hover)] enabled:hover:shadow-glow-accent' : ''}`}
                            >
                              {certified ? '✓' : ''}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-muted">
        Ändringar slår igenom direkt i täckningen på planeringen. Certifieringar är processer — nya
        processer dyker upp som kolumner här, som behovs- och täckningsrader på planeringen.
      </p>
    </div>
  );
}
