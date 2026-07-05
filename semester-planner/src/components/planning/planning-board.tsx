'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { computeWeekCoverage } from '@/server/engine/coverage';
import { evaluateCandidate, hasBlockingConflict, weeksInRange } from '@/server/engine/conflicts';
import type { CandidateBlock, ConflictWarning } from '@/server/engine/conflicts';
import type { AbsenceStatus, CoverageMode, EngineAbsence } from '@/server/engine/types';
import type { PlanningData } from '@/server/data/planning';
import { deleteAbsenceBlock, saveAbsenceBlock, setDemand } from '@/server/actions/planning';

interface Props {
  data: PlanningData;
  canEdit: boolean;
  isAdmin: boolean;
}

type DragState =
  | { kind: 'create'; operatorId: string; anchorWeek: number; week: number }
  | { kind: 'move'; blockId: string; operatorId: string; grabOffset: number; week: number }
  | { kind: 'resize'; blockId: string; edge: 'start' | 'end'; week: number };

interface EditorState {
  blockId?: string;
  operatorId: string;
  startWeek: number;
  endWeek: number;
  status: AbsenceStatus;
}

const STATUS_LABEL: Record<AbsenceStatus, string> = {
  DRAFT: 'Utkast',
  REQUESTED: 'Begärd',
  PENDING: 'Väntar',
  APPROVED: 'Godkänd',
  DENIED: 'Nekad',
};

const STATUS_CLASS: Record<AbsenceStatus, string> = {
  DRAFT: 'bg-draft border-draft-line',
  REQUESTED: 'bg-requested border-requested-line',
  PENDING: 'bg-pending border-pending-line',
  APPROVED: 'bg-approved border-approved-line',
  DENIED: 'bg-denied border-denied-line opacity-60',
};

const LEVEL_CLASS = {
  green: 'bg-ok/20 text-ok',
  yellow: 'bg-coverage-yellow/20 text-coverage-yellow',
  red: 'bg-alert/25 text-alert',
} as const;

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (
    words.length >= 2 ? `${words[0]![0]}${words[1]![0]}` : (words[0]?.slice(0, 2) ?? '?')
  ).toUpperCase();
}

export function PlanningBoard({ data, canEdit, isAdmin }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { processes, demand, holidays, settings } = data;
  const year = settings.planningYear;

  const weeks = useMemo(
    () =>
      Array.from(
        { length: Math.min(settings.visibleWeeks, 53 - settings.startWeek + 1) },
        (_, i) => settings.startWeek + i,
      ),
    [settings.visibleWeeks, settings.startWeek],
  );

  const [mode, setMode] = useState<CoverageMode>('confirmed');
  const [blocks, setBlocks] = useState<EngineAbsence[]>(data.absences);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<ConflictWarning[]>([]);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;

  // Server is the source of truth: re-sync whenever fresh data arrives.
  useEffect(() => setBlocks(data.absences), [data.absences]);

  const lockedWeeks = useMemo(() => new Set(settings.lockedWeeks), [settings.lockedWeeks]);
  const holidayByWeek = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const h of holidays) map.set(h.week, [...(map.get(h.week) ?? []), h.name]);
    return map;
  }, [holidays]);

  const operatorsByShift = useMemo(() => {
    const map = new Map<string, typeof data.operators>();
    for (const shift of settings.shifts) map.set(shift, []);
    for (const op of data.operators) {
      if (!op.active) continue;
      map.set(op.shift, [...(map.get(op.shift) ?? []), op]);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.operators, settings.shifts]);

  // ── Candidate under drag: engine-evaluated live ─────────────────────────
  const dragCandidate: CandidateBlock | null = useMemo(() => {
    if (!drag) return null;
    if (drag.kind === 'create') {
      return {
        id: '∅new',
        operatorId: drag.operatorId,
        startWeek: Math.min(drag.anchorWeek, drag.week),
        endWeek: Math.max(drag.anchorWeek, drag.week),
        status: 'DRAFT',
      };
    }
    const block = blocks.find((b) => b.id === drag.blockId);
    if (!block) return null;
    if (drag.kind === 'move') {
      const length = block.endWeek - block.startWeek;
      const start = Math.max(1, Math.min(53 - length, drag.week - drag.grabOffset));
      return { id: block.id, operatorId: block.operatorId, startWeek: start, endWeek: start + length };
    }
    return {
      id: block.id,
      operatorId: block.operatorId,
      startWeek: drag.edge === 'start' ? drag.week : block.startWeek,
      endWeek: drag.edge === 'end' ? drag.week : block.endWeek,
    };
  }, [drag, blocks]);

  const dragWarnings = useMemo(
    () =>
      dragCandidate
        ? evaluateCandidate(dragCandidate, {
            operators: data.operators,
            absences: blocks,
            processes,
            demand,
            settings,
          })
        : [],
    [dragCandidate, data.operators, blocks, processes, demand, settings],
  );
  const dragBlocked = hasBlockingConflict(dragWarnings) && !isAdmin;

  // ── Persistence with optimistic update + reconciliation ─────────────────
  const persistBlock = useCallback(
    (candidate: EditorState) => {
      const previous = blocks;
      const startWeek = Math.min(candidate.startWeek, candidate.endWeek);
      const endWeek = Math.max(candidate.startWeek, candidate.endWeek);
      const optimisticId = candidate.blockId ?? `optimistic-${Date.now()}`;
      const optimistic: EngineAbsence = {
        id: optimisticId,
        operatorId: candidate.operatorId,
        startWeek,
        endWeek,
        status: candidate.status,
      };
      setBlocks((prev) => [...prev.filter((b) => b.id !== candidate.blockId), optimistic]);
      setError(null);

      startTransition(async () => {
        const result = await saveAbsenceBlock({
          id: candidate.blockId,
          operatorId: candidate.operatorId,
          year,
          startWeek,
          endWeek,
          status: candidate.status,
        });
        if (!result.ok) {
          setBlocks(previous);
          setError(result.error ?? 'Kunde inte spara');
        } else {
          setNotices(result.warnings ?? []);
          router.refresh();
        }
      });
    },
    [blocks, router, year],
  );

  const removeBlock = useCallback(
    (blockId: string) => {
      const previous = blocks;
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      setEditor(null);
      startTransition(async () => {
        const result = await deleteAbsenceBlock({ id: blockId });
        if (!result.ok) {
          setBlocks(previous);
          setError(result.error ?? 'Kunde inte ta bort');
        } else {
          router.refresh();
        }
      });
    },
    [blocks, router],
  );

  // ── Drag lifecycle (pointer) ─────────────────────────────────────────────
  useEffect(() => {
    if (!drag) return;
    const finish = () => {
      const current = dragRef.current;
      setDrag(null);
      if (!current) return;
      const candidate = ((): EditorState | null => {
        if (current.kind === 'create') {
          return {
            operatorId: current.operatorId,
            startWeek: Math.min(current.anchorWeek, current.week),
            endWeek: Math.max(current.anchorWeek, current.week),
            status: 'DRAFT',
          };
        }
        const block = blocks.find((b) => b.id === current.blockId);
        if (!block) return null;
        if (current.kind === 'move') {
          const length = block.endWeek - block.startWeek;
          const start = Math.max(1, Math.min(53 - length, current.week - current.grabOffset));
          if (start === block.startWeek) return null; // no-op drag
          return {
            blockId: block.id,
            operatorId: block.operatorId,
            startWeek: start,
            endWeek: start + length,
            status: block.status,
          };
        }
        const startWeek = current.edge === 'start' ? current.week : block.startWeek;
        const endWeek = current.edge === 'end' ? current.week : block.endWeek;
        if (startWeek === block.startWeek && endWeek === block.endWeek) return null;
        return { blockId: block.id, operatorId: block.operatorId, startWeek, endWeek, status: block.status };
      })();
      if (!candidate) return;
      const warnings = evaluateCandidate(
        {
          id: candidate.blockId ?? '∅new',
          operatorId: candidate.operatorId,
          startWeek: candidate.startWeek,
          endWeek: candidate.endWeek,
          status: candidate.status,
        },
        { operators: data.operators, absences: blocks, processes, demand, settings },
      );
      if (hasBlockingConflict(warnings) && !isAdmin) {
        setError('Släppt på låst vecka — ändringen sparades inte');
        return;
      }
      persistBlock(candidate);
    };
    window.addEventListener('pointerup', finish);
    return () => window.removeEventListener('pointerup', finish);
  }, [drag, blocks, data.operators, processes, demand, settings, isAdmin, persistBlock]);

  const onCellEnter = (week: number) => {
    if (!dragRef.current) return;
    setDrag((prev) => (prev ? { ...prev, week } : prev));
  };

  // ── Demand editing ───────────────────────────────────────────────────────
  const [demandEdit, setDemandEdit] = useState<{ processId: string; week: number; value: string } | null>(null);
  const commitDemand = () => {
    if (!demandEdit) return;
    const required = Number(demandEdit.value);
    const edit = demandEdit;
    setDemandEdit(null);
    if (!Number.isInteger(required) || required < 0) return;
    startTransition(async () => {
      const result = await setDemand({ processId: edit.processId, year, week: edit.week, required });
      if (!result.ok) setError(result.error ?? 'Kunde inte spara behov');
      else router.refresh();
    });
  };

  // ── Coverage (client-side, same engine as the server) ──────────────────
  const coverage = useMemo(() => {
    const result = new Map<string, ReturnType<typeof computeWeekCoverage>>();
    for (const shift of settings.shifts) {
      for (const week of weeks) {
        result.set(
          `${shift}:${week}`,
          computeWeekCoverage({
            operators: data.operators,
            absences: blocks,
            processes,
            demand,
            week,
            shift,
            mode,
            settings,
          }),
        );
      }
    }
    return result;
  }, [settings, weeks, data.operators, blocks, processes, demand, mode]);

  const gridTemplate = { gridTemplateColumns: `minmax(10rem, 12rem) repeat(${weeks.length}, minmax(3.25rem, 1fr))` };

  const blocksFor = (operatorId: string) =>
    blocks.filter((b) => b.operatorId === operatorId && b.endWeek >= weeks[0]! && b.startWeek <= weeks[weeks.length - 1]!);

  const candidatePreviewFor = (operatorId: string) =>
    dragCandidate && dragCandidate.operatorId === operatorId ? dragCandidate : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-xl font-extrabold">
          Planering {year}
        </h1>
        <div role="group" aria-label="Täckningsläge" className="flex overflow-hidden rounded-md border border-line">
          {(['confirmed', 'projected'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-sm font-semibold transition-[background-color,box-shadow] duration-(--motion-base) ${
                mode === m ? 'bg-accent text-ink-inverse shadow-glow-accent' : 'bg-panel text-ink-muted hover:text-ink'
              }`}
            >
              {m === 'confirmed' ? 'Bekräftad' : 'Prognos'}
            </button>
          ))}
        </div>
        {drag && (
          <span
            role="status"
            className={`rounded-md border px-3 py-1 text-sm font-semibold ${
              dragBlocked
                ? 'border-alert text-alert shadow-glow-risk'
                : dragWarnings.length
                  ? 'border-coverage-yellow text-coverage-yellow'
                  : 'border-ok text-ok shadow-glow-ok'
            }`}
          >
            {dragBlocked
              ? 'Låst vecka'
              : dragWarnings.length
                ? `${dragWarnings.length} varning${dragWarnings.length > 1 ? 'ar' : ''}`
                : 'OK'}
          </span>
        )}
        {error && (
          <span role="alert" className="rounded-md border border-alert px-3 py-1 text-sm font-semibold text-alert">
            {error}
            <button type="button" className="ml-2 underline" onClick={() => setError(null)}>
              stäng
            </button>
          </span>
        )}
      </div>

      {/* Post-save warnings */}
      {notices.length > 0 && (
        <div className="rounded-md border border-coverage-yellow/60 bg-panel p-2 text-sm text-coverage-yellow">
          {notices.slice(0, 4).map((w, i) => (
            <div key={i}>{w.message}</div>
          ))}
          <button type="button" className="mt-1 text-xs underline" onClick={() => setNotices([])}>
            stäng
          </button>
        </div>
      )}

      {/* Board */}
      <div className="overflow-x-auto rounded-lg border border-line bg-panel shadow-panel select-none">
        {/* Week header */}
        <div className="grid border-b border-line-strong" style={gridTemplate}>
          <div className="px-3 py-2 text-xs font-semibold text-ink-muted">Operatör</div>
          {weeks.map((week) => {
            const holiday = holidayByWeek.get(week);
            return (
              <div
                key={week}
                title={holiday?.join(', ')}
                className={`border-l border-line px-1 py-2 text-center font-mono text-xs ${
                  lockedWeeks.has(week) ? 'bg-bg-2 text-ink-muted' : holiday ? 'text-holiday' : 'text-ink-muted'
                }`}
                style={holiday ? { background: 'var(--holiday-pattern)' } : undefined}
              >
                v.{week}
                {lockedWeeks.has(week) ? ' 🔒' : ''}
              </div>
            );
          })}
        </div>

        {settings.shifts.map((shift) => (
          <section key={shift} aria-label={`Skift ${shift}`}>
            <div className="grid border-b border-line bg-bg-2" style={gridTemplate}>
              <div className="px-3 py-1.5 font-heading text-sm font-extrabold">{shift}</div>
              <div style={{ gridColumn: `span ${weeks.length}` }} />
            </div>

            {(operatorsByShift.get(shift) ?? []).map((op) => {
              const preview = candidatePreviewFor(op.id);
              return (
                <div key={op.id} className="grid border-b border-line/50" style={gridTemplate}>
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <span
                      aria-hidden
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill text-[10px] font-bold text-ink-inverse"
                      style={{ backgroundColor: op.iconColor ?? 'var(--accent)' }}
                    >
                      {initials(op.name)}
                    </span>
                    <span className="truncate text-sm">{op.name}</span>
                  </div>

                  <div className="relative border-l border-line" style={{ gridColumn: `span ${weeks.length}` }}>
                    {/* Cells */}
                    <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
                      {weeks.map((week) => (
                        <button
                          key={week}
                          type="button"
                          tabIndex={canEdit ? 0 : -1}
                          disabled={!canEdit}
                          aria-label={`Skapa frånvaro för ${op.name} v.${week}`}
                          className={`h-9 border-l border-line/40 first:border-l-0 focus-visible:outline-2 ${
                            lockedWeeks.has(week) ? 'bg-bg-2/60' : 'hover:bg-raised/60'
                          }`}
                          style={holidayByWeek.get(week) ? { background: 'var(--holiday-pattern)' } : undefined}
                          onPointerDown={(e) => {
                            if (!canEdit || e.button !== 0) return;
                            e.preventDefault();
                            setDrag({ kind: 'create', operatorId: op.id, anchorWeek: week, week });
                          }}
                          onPointerEnter={() => onCellEnter(week)}
                          onClick={(e) => {
                            // Keyboard/click fallback: plain click (no drag movement) opens the editor.
                            if (!canEdit || e.detail !== 0) return; // e.detail 0 = keyboard "click"
                            setEditor({ operatorId: op.id, startWeek: week, endWeek: week, status: 'DRAFT' });
                          }}
                        />
                      ))}
                    </div>

                    {/* Blocks */}
                    {blocksFor(op.id).map((block) => {
                      const isDragging =
                        drag && drag.kind !== 'create' && 'blockId' in drag && drag.blockId === block.id;
                      const shown =
                        isDragging && dragCandidate
                          ? { startWeek: dragCandidate.startWeek, endWeek: dragCandidate.endWeek }
                          : block;
                      const from = Math.max(shown.startWeek, weeks[0]!);
                      const to = Math.min(shown.endWeek, weeks[weeks.length - 1]!);
                      const colStart = from - weeks[0]! + 1;
                      const span = to - from + 1;
                      if (span <= 0) return null;
                      return (
                        <div
                          key={block.id}
                          className="pointer-events-none absolute inset-y-1 grid w-full"
                          style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}
                        >
                          <div
                            role="button"
                            tabIndex={canEdit ? 0 : -1}
                            aria-label={`${STATUS_LABEL[block.status]} frånvaro ${op.name} v.${block.startWeek}–${block.endWeek}. Tryck Enter för att redigera.`}
                            className={`pointer-events-auto relative flex cursor-grab items-center justify-center rounded-md border text-[11px] font-semibold transition-[box-shadow,transform] duration-(--motion-fast) ease-(--ease-spring) ${STATUS_CLASS[block.status]} ${
                              isDragging
                                ? dragBlocked
                                  ? 'shadow-glow-risk'
                                  : 'shadow-glow-accent [transform:var(--lift-drag)]'
                                : 'hover:shadow-glow-accent'
                            }`}
                            style={{ gridColumn: `${colStart} / span ${span}` }}
                            onPointerDown={(e) => {
                              if (!canEdit || e.button !== 0) return;
                              e.preventDefault();
                              e.stopPropagation();
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              const weekWidth = rect.width / (shown.endWeek - shown.startWeek + 1);
                              const grabOffset = Math.floor((e.clientX - rect.left) / weekWidth);
                              setDrag({
                                kind: 'move',
                                blockId: block.id,
                                operatorId: op.id,
                                grabOffset,
                                week: shown.startWeek + grabOffset,
                              });
                            }}
                            onKeyDown={(e) => {
                              if (!canEdit) return;
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setEditor({
                                  blockId: block.id,
                                  operatorId: block.operatorId,
                                  startWeek: block.startWeek,
                                  endWeek: block.endWeek,
                                  status: block.status,
                                });
                              }
                            }}
                            onDoubleClick={() =>
                              canEdit &&
                              setEditor({
                                blockId: block.id,
                                operatorId: block.operatorId,
                                startWeek: block.startWeek,
                                endWeek: block.endWeek,
                                status: block.status,
                              })
                            }
                          >
                            <span className="truncate px-2">{STATUS_LABEL[block.status]}</span>
                            {canEdit && (
                              <>
                                <span
                                  aria-hidden
                                  className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize"
                                  onPointerDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDrag({ kind: 'resize', blockId: block.id, edge: 'start', week: block.startWeek });
                                  }}
                                />
                                <span
                                  aria-hidden
                                  className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize"
                                  onPointerDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDrag({ kind: 'resize', blockId: block.id, edge: 'end', week: block.endWeek });
                                  }}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Create preview */}
                    {preview && drag?.kind === 'create' && (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-y-1 grid w-full"
                        style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}
                      >
                        <div
                          className={`rounded-md border-2 border-dashed ${
                            dragBlocked ? 'border-alert shadow-glow-risk' : 'border-accent shadow-glow-accent'
                          }`}
                          style={{
                            gridColumn: `${Math.max(preview.startWeek, weeks[0]!) - weeks[0]! + 1} / span ${
                              Math.min(preview.endWeek, weeks[weeks.length - 1]!) -
                              Math.max(preview.startWeek, weeks[0]!) +
                              1
                            }`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Coverage rows for this shift */}
            {processes.map((process) => (
              <div key={process.id} className="grid border-b border-line/50 bg-bg-2/50" style={gridTemplate}>
                <div className="truncate px-3 py-1 text-xs text-ink-muted">{process.name}</div>
                {weeks.map((week) => {
                  const slot = coverage.get(`${shift}:${week}`)?.[process.id];
                  if (!slot) return <div key={week} className="border-l border-line/40" />;
                  return (
                    <div
                      key={week}
                      className={`border-l border-line/40 py-1 text-center font-mono text-[11px] font-bold ${LEVEL_CLASS[slot.level]}`}
                      title={`${process.name} ${shift} v.${week}: ${slot.covered}/${slot.required} (${mode === 'confirmed' ? 'bekräftad' : 'prognos'})`}
                    >
                      {slot.covered}/{slot.required}
                    </div>
                  );
                })}
              </div>
            ))}
          </section>
        ))}

        {/* Demand rows (org-wide, inline-editable) */}
        <section aria-label="Behov per process">
          <div className="grid border-b border-line bg-bg-2" style={gridTemplate}>
            <div className="px-3 py-1.5 font-heading text-sm font-extrabold">Behov</div>
            <div style={{ gridColumn: `span ${weeks.length}` }} />
          </div>
          {processes.map((process) => (
            <div key={process.id} className="grid border-b border-line/50" style={gridTemplate}>
              <div className="truncate px-3 py-1 text-xs text-ink-muted">{process.name}</div>
              {weeks.map((week) => {
                const value = demand[process.id]?.[week] ?? settings.defaultRequired;
                const editing = demandEdit && demandEdit.processId === process.id && demandEdit.week === week;
                return (
                  <div key={week} className="border-l border-line/40 text-center">
                    {editing ? (
                      <input
                        autoFocus
                        type="number"
                        min={0}
                        max={50}
                        defaultValue={demandEdit.value}
                        aria-label={`Behov ${process.name} v.${week}`}
                        className="w-full bg-raised py-1 text-center font-mono text-[11px]"
                        onChange={(e) => setDemandEdit({ ...demandEdit, value: e.target.value })}
                        onBlur={commitDemand}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitDemand();
                          if (e.key === 'Escape') setDemandEdit(null);
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        disabled={!canEdit}
                        aria-label={`Behov ${process.name} v.${week}: ${value}. Klicka för att ändra.`}
                        className="w-full py-1 font-mono text-[11px] text-ink-muted enabled:hover:bg-raised enabled:hover:text-ink"
                        onClick={() =>
                          canEdit && setDemandEdit({ processId: process.id, week, value: String(value) })
                        }
                      >
                        {value}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </section>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        {(Object.keys(STATUS_LABEL) as AbsenceStatus[]).map((s) => (
          <span key={s} className={`rounded-md border px-2 py-0.5 ${STATUS_CLASS[s]}`}>
            {STATUS_LABEL[s]}
          </span>
        ))}
        <span className="ml-2">🔒 = låst vecka · randig = helgdag · drag för att skapa/flytta, Enter för tangentbord</span>
      </div>

      {/* Editor dialog: keyboard/click fallback for create & edit */}
      {editor && (
        <BlockEditor
          editor={editor}
          operators={data.operators}
          warnings={evaluateCandidate(
            {
              id: editor.blockId ?? '∅new',
              operatorId: editor.operatorId,
              startWeek: editor.startWeek,
              endWeek: editor.endWeek,
              status: editor.status,
            },
            { operators: data.operators, absences: blocks, processes, demand, settings },
          )}
          isAdmin={isAdmin}
          onChange={setEditor}
          onCancel={() => setEditor(null)}
          onDelete={editor.blockId ? () => removeBlock(editor.blockId!) : undefined}
          onSave={() => {
            setEditor(null);
            persistBlock(editor);
          }}
        />
      )}
    </div>
  );
}

function BlockEditor({
  editor,
  operators,
  warnings,
  isAdmin,
  onChange,
  onCancel,
  onDelete,
  onSave,
}: {
  editor: EditorState;
  operators: PlanningData['operators'];
  warnings: ConflictWarning[];
  isAdmin: boolean;
  onChange: (e: EditorState) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onSave: () => void;
}) {
  const operator = operators.find((o) => o.id === editor.operatorId);
  const blocked = hasBlockingConflict(warnings) && !isAdmin;
  const weekCount = weeksInRange(editor.startWeek, editor.endWeek).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Frånvaro för ${operator?.name ?? ''}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70 p-4"
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
    >
      <div className="w-full max-w-sm rounded-lg border border-line bg-panel p-5 shadow-pop">
        <h2 className="font-heading text-lg font-extrabold">
          {editor.blockId ? 'Redigera frånvaro' : 'Ny frånvaro'} — {operator?.name}
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="text-ink-muted">Från vecka</span>
              <input
                autoFocus
                type="number"
                min={1}
                max={53}
                value={editor.startWeek}
                onChange={(e) => onChange({ ...editor, startWeek: Number(e.target.value) })}
                className="rounded-md border border-line bg-bg-2 px-2 py-1.5"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="text-ink-muted">Till vecka</span>
              <input
                type="number"
                min={1}
                max={53}
                value={editor.endWeek}
                onChange={(e) => onChange({ ...editor, endWeek: Number(e.target.value) })}
                className="rounded-md border border-line bg-bg-2 px-2 py-1.5"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-muted">Status</span>
            <select
              value={editor.status}
              onChange={(e) => onChange({ ...editor, status: e.target.value as AbsenceStatus })}
              className="rounded-md border border-line bg-bg-2 px-2 py-1.5"
            >
              {(Object.keys(STATUS_LABEL) as AbsenceStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-ink-muted">{weekCount} vecka/veckor</p>
          {warnings.length > 0 && (
            <ul className={`rounded-md border p-2 text-xs ${blocked ? 'border-alert text-alert' : 'border-coverage-yellow/60 text-coverage-yellow'}`}>
              {warnings.slice(0, 5).map((w, i) => (
                <li key={i}>{w.message}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-5 flex items-center justify-between gap-2">
          {onDelete ? (
            <button type="button" onClick={onDelete} className="text-sm font-semibold text-alert hover:underline">
              Ta bort
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-3 py-1.5 text-sm font-semibold text-ink-muted hover:bg-raised"
            >
              Avbryt
            </button>
            <button
              type="button"
              disabled={blocked}
              onClick={onSave}
              className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-ink-inverse transition-shadow duration-(--motion-base) hover:shadow-glow-accent disabled:opacity-50"
            >
              Spara
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
