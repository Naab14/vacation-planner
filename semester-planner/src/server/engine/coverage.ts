import type {
  AbsenceStatus,
  CoverageLevel,
  CoverageMode,
  DemandMap,
  EngineAbsence,
  EngineOperator,
  EngineProcess,
  EngineSettings,
  WeekCoverage,
} from './types';

/**
 * Statuses that count an operator as "out".
 * confirmed: only APPROVED. projected: everything a planner should anticipate.
 * DRAFT and DENIED never count.
 */
export const OUT_STATUSES: Record<CoverageMode, ReadonlySet<AbsenceStatus>> = {
  confirmed: new Set<AbsenceStatus>(['APPROVED']),
  projected: new Set<AbsenceStatus>(['APPROVED', 'PENDING', 'REQUESTED']),
};

export function isAbsentInWeek(
  absences: readonly EngineAbsence[],
  operatorId: string,
  week: number,
  mode: CoverageMode,
): boolean {
  const statuses = OUT_STATUSES[mode];
  return absences.some(
    (a) =>
      a.operatorId === operatorId &&
      statuses.has(a.status) &&
      week >= a.startWeek &&
      week <= a.endWeek,
  );
}

export function coverageLevel(covered: number, required: number): CoverageLevel {
  if (covered >= required) return 'green';
  if (covered === required - 1) return 'yellow';
  return 'red';
}

/**
 * Compute covered vs required per process for one week within ONE shift.
 * Assignment strategy (ported from the reference SPA):
 *   1. operators with exactly one certification are assigned to it first;
 *   2. multi-certified operators go to their process with the lowest
 *      covered/required ratio at that moment.
 */
export function computeWeekCoverage(params: {
  operators: readonly EngineOperator[];
  absences: readonly EngineAbsence[];
  processes: readonly EngineProcess[];
  demand: DemandMap;
  week: number;
  shift: string;
  mode: CoverageMode;
  settings: Pick<EngineSettings, 'defaultRequired'>;
}): WeekCoverage {
  const { operators, absences, processes, demand, week, shift, mode, settings } = params;

  const coverage: WeekCoverage = {};
  for (const process of processes) {
    coverage[process.id] = {
      process,
      required: demand[process.id]?.[week] ?? settings.defaultRequired,
      covered: 0,
      level: 'red',
      operatorsIn: [],
      operatorsOut: [],
    };
  }

  const eligible = operators.filter(
    (op) => op.active && op.shift === shift && op.certifications.length > 0,
  );

  const present: EngineOperator[] = [];
  for (const op of eligible) {
    if (isAbsentInWeek(absences, op.id, week, mode)) {
      for (const processId of op.certifications) {
        coverage[processId]?.operatorsOut.push(op.id);
      }
    } else {
      present.push(op);
    }
  }

  const multiCert: EngineOperator[] = [];
  for (const op of present) {
    if (op.certifications.length === 1) {
      const slot = coverage[op.certifications[0]!];
      if (slot) {
        slot.covered += 1;
        slot.operatorsIn.push(op.id);
      }
    } else {
      multiCert.push(op);
    }
  }

  for (const op of multiCert) {
    let target: string | null = null;
    let lowestRatio = Infinity;
    for (const processId of op.certifications) {
      const slot = coverage[processId];
      if (!slot) continue;
      const ratio = slot.required > 0 ? slot.covered / slot.required : Infinity;
      if (ratio < lowestRatio) {
        lowestRatio = ratio;
        target = processId;
      }
    }
    if (target) {
      coverage[target]!.covered += 1;
      coverage[target]!.operatorsIn.push(op.id);
    }
  }

  for (const slot of Object.values(coverage)) {
    slot.level = coverageLevel(slot.covered, slot.required);
  }

  return coverage;
}
