'use client';

import { useMemo, useState } from 'react';
import { toCsv, type CsvValue } from '@/lib/csv';
import { Panel } from '@/components/ui/panel';

export interface ReportCell {
  week: number;
  shift: string;
  processId: string;
  processName: string;
  required: number;
  covered: number;
  level: 'green' | 'yellow' | 'red';
}

export interface ReportAbsence {
  operator: string;
  shift: string;
  status: string;
  startWeek: number;
  endWeek: number;
}

export interface OperatorSummary {
  name: string;
  shift: string;
  approvedWeeks: number;
  projectedWeeks: number;
  blocks: number;
}

const LEVEL_CLASS = {
  green: 'bg-ok/20 text-ok',
  yellow: 'bg-coverage-yellow/20 text-coverage-yellow',
  red: 'bg-alert/25 text-alert',
} as const;

function downloadCsv(filename: string, headers: string[], rows: CsvValue[][]) {
  // BOM so Excel opens the UTF-8 file (Swedish names) correctly.
  const blob = new Blob(['﻿' + toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsView({
  year,
  weeks,
  shifts,
  processes,
  cells,
  absences,
  summary,
}: {
  year: number;
  weeks: number[];
  shifts: string[];
  processes: Array<{ id: string; name: string }>;
  cells: ReportCell[];
  absences: ReportAbsence[];
  summary: OperatorSummary[];
}) {
  const [shift, setShift] = useState(shifts[0] ?? '');

  const cellMap = useMemo(() => {
    const map = new Map<string, ReportCell>();
    for (const cell of cells) map.set(`${cell.shift}|${cell.processId}|${cell.week}`, cell);
    return map;
  }, [cells]);

  const exportCoverage = () =>
    downloadCsv(
      `tackning-${year}.csv`,
      ['År', 'Vecka', 'Skift', 'Process', 'Behov', 'Bemannade', 'Nivå'],
      cells.map((c) => [year, c.week, c.shift, c.processName, c.required, c.covered, c.level]),
    );

  const exportAbsences = () =>
    downloadCsv(
      `franvaro-${year}.csv`,
      ['År', 'Medarbetare', 'Skift', 'Status', 'Från vecka', 'Till vecka'],
      absences.map((a) => [year, a.operator, a.shift, a.status, a.startWeek, a.endWeek]),
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-xl font-extrabold">Rapporter {year}</h1>
        <div className="ml-auto flex gap-2 print:hidden">
          <button
            type="button"
            onClick={exportCoverage}
            className="rounded-md border border-line bg-panel px-3 py-1.5 text-sm font-semibold transition-shadow duration-(--motion-base) hover:shadow-glow-accent"
          >
            Exportera täckning (CSV)
          </button>
          <button
            type="button"
            onClick={exportAbsences}
            className="rounded-md border border-line bg-panel px-3 py-1.5 text-sm font-semibold transition-shadow duration-(--motion-base) hover:shadow-glow-accent"
          >
            Exportera frånvaro (CSV)
          </button>
        </div>
      </div>

      <Panel className="p-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold">Täckningskarta (prognos)</h2>
          <div role="group" aria-label="Välj skift" className="flex gap-1 print:hidden">
            {shifts.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setShift(s)}
                aria-pressed={shift === s}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-[box-shadow,color] duration-(--motion-base) ${
                  shift === s ? 'bg-accent text-ink-inverse shadow-glow-accent' : 'bg-raised text-ink-muted hover:text-ink'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 bg-panel px-2 py-1 text-left font-semibold text-ink-muted">Process</th>
                {weeks.map((w) => (
                  <th key={w} className="px-1 py-1 text-center font-mono font-semibold text-ink-muted">
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processes.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="sticky left-0 max-w-40 truncate bg-panel px-2 py-1 font-semibold">{p.name}</td>
                  {weeks.map((w) => {
                    const cell = cellMap.get(`${shift}|${p.id}|${w}`);
                    if (!cell) return <td key={w} />;
                    return (
                      <td key={w} className="p-0.5">
                        <div
                          title={`v.${w} ${p.name}: ${cell.covered}/${cell.required}`}
                          className={`flex h-6 min-w-7 items-center justify-center rounded-sm font-mono font-bold ${LEVEL_CLASS[cell.level]}`}
                        >
                          {cell.covered}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Siffran är antal bemannade; färgen jämför mot behovet (grön ≥ behov, gul = behov−1, röd &lt; behov−1).
        </p>
      </Panel>

      <Panel className="p-4">
        <h2 className="text-sm font-bold">Frånvaro per medarbetare</h2>
        {summary.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Ingen frånvaro registrerad för året.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-muted">
                  <th className="py-1 pr-3 font-semibold">Medarbetare</th>
                  <th className="py-1 pr-3 font-semibold">Skift</th>
                  <th className="py-1 pr-3 font-semibold">Godkända veckor</th>
                  <th className="py-1 pr-3 font-semibold">Väntande veckor</th>
                  <th className="py-1 font-semibold">Perioder</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row) => (
                  <tr key={`${row.name}-${row.shift}`} className="border-t border-line">
                    <td className="py-1.5 pr-3">{row.name}</td>
                    <td className="py-1.5 pr-3">{row.shift}</td>
                    <td className="py-1.5 pr-3 font-mono">{row.approvedWeeks}</td>
                    <td className="py-1.5 pr-3 font-mono">{row.projectedWeeks}</td>
                    <td className="py-1.5 font-mono">{row.blocks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
