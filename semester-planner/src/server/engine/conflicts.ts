import { computeWeekCoverage, isAbsentInWeek, OUT_STATUSES } from './coverage';
import type {
  AbsenceStatus,
  DemandMap,
  EngineAbsence,
  EngineOperator,
  EngineProcess,
  EngineSettings,
} from './types';

export interface CandidateBlock {
  /** Existing block id when moving/resizing; new blocks use a placeholder id. */
  id: string;
  operatorId: string;
  startWeek: number;
  endWeek: number;
  status?: AbsenceStatus;
}

export type ConflictKind = 'locked-week' | 'overlap' | 'min-staffing' | 'coverage-red';

export interface ConflictWarning {
  kind: ConflictKind;
  week: number;
  /** Only locked-week blocks the mutation (unless admin override). */
  blocking: boolean;
  message: string;
  processId?: string;
}

export interface ConflictContext {
  operators: readonly EngineOperator[];
  absences: readonly EngineAbsence[];
  processes: readonly EngineProcess[];
  demand: DemandMap;
  settings: EngineSettings;
}

export function weeksInRange(startWeek: number, endWeek: number): number[] {
  const start = Math.min(startWeek, endWeek);
  const end = Math.max(startWeek, endWeek);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** Overlap counts only projected statuses — never drafts, never denied. */
const PROJECTED = OUT_STATUSES.projected;

/**
 * "before" is the plan exactly as it stands (including the candidate's
 * current position when moving/resizing); "after" replaces it with the
 * proposed position. Warnings fire only when after is worse than before.
 */
function resolveCandidate(
  absences: readonly EngineAbsence[],
  candidate: CandidateBlock,
): { candidateBlock: EngineAbsence; before: readonly EngineAbsence[]; after: EngineAbsence[] } {
  const existing = absences.find((a) => a.id === candidate.id);
  const candidateBlock: EngineAbsence = {
    id: candidate.id,
    operatorId: candidate.operatorId,
    startWeek: Math.min(candidate.startWeek, candidate.endWeek),
    endWeek: Math.max(candidate.startWeek, candidate.endWeek),
    status: candidate.status ?? existing?.status ?? 'REQUESTED',
  };
  const after = [...absences.filter((a) => a.id !== candidate.id), candidateBlock];
  return { candidateBlock, before: absences, after };
}

/**
 * Evaluate a create/move/resize against all planning rules.
 * Comparisons are before/after so pre-existing problems are never blamed
 * on the candidate block.
 */
export function evaluateCandidate(
  candidate: CandidateBlock,
  context: ConflictContext,
): ConflictWarning[] {
  const { operators, absences, processes, demand, settings } = context;
  const warnings: ConflictWarning[] = [];

  const operator = operators.find((op) => op.id === candidate.operatorId);
  if (!operator) return warnings;
  const shift = operator.shift;

  const { candidateBlock, before: current, after: proposed } = resolveCandidate(absences, candidate);
  const weeks = weeksInRange(candidateBlock.startWeek, candidateBlock.endWeek);
  const locked = new Set(settings.lockedWeeks);
  const shiftOperators = operators.filter((op) => op.active && op.shift === shift);
  const shiftOperatorIds = new Set(shiftOperators.map((op) => op.id));

  for (const week of weeks) {
    // 1. Locked week — hard block.
    if (locked.has(week)) {
      warnings.push({
        kind: 'locked-week',
        week,
        blocking: true,
        message: `v.${week} är låst för planering`,
      });
    }

    // 2. Allowed overlap — simultaneous projected absences within the SAME shift.
    if (PROJECTED.has(candidateBlock.status)) {
      const simultaneous = proposed.filter(
        (a) =>
          PROJECTED.has(a.status) &&
          shiftOperatorIds.has(a.operatorId) &&
          week >= a.startWeek &&
          week <= a.endWeek,
      );
      const distinctOut = new Set(simultaneous.map((a) => a.operatorId)).size;
      if (distinctOut > settings.allowedOverlap) {
        warnings.push({
          kind: 'overlap',
          week,
          blocking: false,
          message: `v.${week}: ${distinctOut} frånvarande samtidigt i ${shift} (tillåtet: ${settings.allowedOverlap})`,
        });
      }
    }

    // 3. Minimum staffing — warn only if the candidate makes it worse.
    if (settings.minStaffing > 0) {
      const staffedBefore = shiftOperators.filter(
        (op) => !isAbsentInWeek(current, op.id, week, 'projected'),
      ).length;
      const staffedAfter = shiftOperators.filter(
        (op) => !isAbsentInWeek(proposed, op.id, week, 'projected'),
      ).length;
      if (staffedAfter < settings.minStaffing && staffedAfter < staffedBefore) {
        warnings.push({
          kind: 'min-staffing',
          week,
          blocking: false,
          message: `v.${week}: ${shift} under minimibemanning (${staffedAfter}/${settings.minStaffing})`,
        });
      }
    }

    // 4. Projected RED — only when the candidate newly causes or worsens it.
    const before = computeWeekCoverage({
      operators, absences: current, processes, demand, week, shift,
      mode: 'projected', settings,
    });
    const after = computeWeekCoverage({
      operators, absences: proposed, processes, demand, week, shift,
      mode: 'projected', settings,
    });
    for (const processId of Object.keys(after)) {
      const a = after[processId]!;
      const b = before[processId];
      if (a.level === 'red' && (!b || b.level !== 'red' || a.covered < b.covered)) {
        warnings.push({
          kind: 'coverage-red',
          week,
          blocking: false,
          processId,
          message: `v.${week}: ${a.process.name} skulle bli RÖD (${a.covered}/${a.required})`,
        });
      }
    }
  }

  return warnings;
}

export function hasBlockingConflict(warnings: readonly ConflictWarning[]): boolean {
  return warnings.some((w) => w.blocking);
}
