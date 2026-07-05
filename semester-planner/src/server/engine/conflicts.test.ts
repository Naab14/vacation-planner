import { describe, expect, it } from 'vitest';
import { AbsenceStatus } from '@prisma/client';
import { evaluateCandidate, hasBlockingConflict, weeksInRange } from './conflicts';
import type { ConflictContext } from './conflicts';
import type { EngineAbsence, EngineOperator, EngineProcess } from './types';

const processes: EngineProcess[] = [{ id: 'p1', name: 'Avsyning' }];

function op(id: string, shift = 'S1', certifications = ['p1']): EngineOperator {
  return { id, shift, active: true, certifications };
}

function absence(
  id: string,
  operatorId: string,
  startWeek: number,
  endWeek: number,
  status: AbsenceStatus = AbsenceStatus.APPROVED,
): EngineAbsence {
  return { id, operatorId, startWeek, endWeek, status };
}

function context(overrides: Partial<ConflictContext> = {}): ConflictContext {
  return {
    operators: [op('a'), op('b'), op('c'), op('d')],
    absences: [],
    processes,
    demand: {},
    settings: { minStaffing: 0, defaultRequired: 2, allowedOverlap: 2, lockedWeeks: [] },
    ...overrides,
  };
}

const candidate = (startWeek: number, endWeek: number, operatorId = 'a') => ({
  id: 'new',
  operatorId,
  startWeek,
  endWeek,
  status: AbsenceStatus.REQUESTED,
});

describe('weeksInRange', () => {
  it('handles reversed ranges', () => {
    expect(weeksInRange(12, 10)).toEqual([10, 11, 12]);
  });
});

describe('evaluateCandidate — locked weeks', () => {
  it('blocks any week in the locked list', () => {
    const warnings = evaluateCandidate(
      candidate(10, 12),
      context({ settings: { minStaffing: 0, defaultRequired: 0, allowedOverlap: 9, lockedWeeks: [11] } }),
    );
    const locked = warnings.filter((w) => w.kind === 'locked-week');
    expect(locked).toHaveLength(1);
    expect(locked[0]!.week).toBe(11);
    expect(hasBlockingConflict(warnings)).toBe(true);
  });
});

describe('evaluateCandidate — overlap', () => {
  it('warns when simultaneous projected absences in the same shift exceed the allowance', () => {
    const ctx = context({
      absences: [
        absence('x1', 'b', 10, 10, AbsenceStatus.APPROVED),
        absence('x2', 'c', 10, 10, AbsenceStatus.PENDING),
      ],
      settings: { minStaffing: 0, defaultRequired: 0, allowedOverlap: 2, lockedWeeks: [] },
    });
    const warnings = evaluateCandidate(candidate(10, 10), ctx);
    expect(warnings.filter((w) => w.kind === 'overlap')).toHaveLength(1);
  });

  it('does not count DRAFT blocks or other shifts', () => {
    const ctx = context({
      operators: [op('a'), op('b'), op('c', 'S2'), op('d')],
      absences: [
        absence('x1', 'b', 10, 10, AbsenceStatus.DRAFT), // draft — ignored
        absence('x2', 'c', 10, 10, AbsenceStatus.APPROVED), // S2 — ignored
      ],
      settings: { minStaffing: 0, defaultRequired: 0, allowedOverlap: 1, lockedWeeks: [] },
    });
    const warnings = evaluateCandidate(candidate(10, 10), ctx);
    expect(warnings.filter((w) => w.kind === 'overlap')).toHaveLength(0);
  });

  it('a DRAFT candidate itself produces no overlap warning', () => {
    const ctx = context({
      absences: [absence('x1', 'b', 10, 10, AbsenceStatus.APPROVED)],
      settings: { minStaffing: 0, defaultRequired: 0, allowedOverlap: 1, lockedWeeks: [] },
    });
    const warnings = evaluateCandidate(
      { ...candidate(10, 10), status: AbsenceStatus.DRAFT },
      ctx,
    );
    expect(warnings.filter((w) => w.kind === 'overlap')).toHaveLength(0);
  });
});

describe('evaluateCandidate — minimum staffing', () => {
  it('warns when the candidate drops staffing below the minimum', () => {
    const ctx = context({
      operators: [op('a'), op('b')],
      absences: [absence('x1', 'b', 10, 10, AbsenceStatus.APPROVED)],
      settings: { minStaffing: 1, defaultRequired: 0, allowedOverlap: 9, lockedWeeks: [] },
    });
    const warnings = evaluateCandidate(candidate(10, 10), ctx);
    expect(warnings.filter((w) => w.kind === 'min-staffing')).toHaveLength(1);
  });

  it('does not blame the candidate when staffing was already below minimum', () => {
    const ctx = context({
      operators: [op('a'), op('b')],
      absences: [
        absence('x1', 'a', 10, 10, AbsenceStatus.APPROVED),
        absence('x2', 'b', 10, 10, AbsenceStatus.APPROVED),
      ],
      settings: { minStaffing: 2, defaultRequired: 0, allowedOverlap: 9, lockedWeeks: [] },
    });
    // moving a's existing block within the same week — staffing unchanged
    const warnings = evaluateCandidate(
      { id: 'x1', operatorId: 'a', startWeek: 10, endWeek: 10 },
      ctx,
    );
    expect(warnings.filter((w) => w.kind === 'min-staffing')).toHaveLength(0);
  });
});

describe('evaluateCandidate — projected red coverage', () => {
  const demand = { p1: { 10: 2 } };

  it('warns when the candidate newly turns a process red', () => {
    const ctx = context({
      operators: [op('a'), op('b')],
      absences: [absence('x1', 'b', 10, 10, AbsenceStatus.APPROVED)], // 1/2 = yellow
      demand,
      settings: { minStaffing: 0, defaultRequired: 2, allowedOverlap: 9, lockedWeeks: [] },
    });
    const warnings = evaluateCandidate(candidate(10, 10), ctx); // 0/2 = red
    expect(warnings.filter((w) => w.kind === 'coverage-red')).toHaveLength(1);
  });

  it('does not blame the candidate for pre-existing red', () => {
    const ctx = context({
      operators: [op('a'), op('b'), op('c')],
      absences: [
        absence('x1', 'b', 10, 10, AbsenceStatus.APPROVED),
        absence('x2', 'c', 10, 10, AbsenceStatus.APPROVED),
      ], // already 1/3 → red
      demand: { p1: { 10: 3 } },
      settings: { minStaffing: 0, defaultRequired: 3, allowedOverlap: 9, lockedWeeks: [] },
    });
    // moving an EXISTING approved block without changing the week
    const warnings = evaluateCandidate(
      { id: 'x1', operatorId: 'b', startWeek: 10, endWeek: 10 },
      ctx,
    );
    expect(warnings.filter((w) => w.kind === 'coverage-red')).toHaveLength(0);
  });

  it('warns when the candidate worsens an already-red process', () => {
    const ctx = context({
      operators: [op('a'), op('b'), op('c'), op('d')],
      absences: [
        absence('x1', 'b', 10, 10, AbsenceStatus.APPROVED),
        absence('x2', 'c', 10, 10, AbsenceStatus.APPROVED),
      ], // 2/4 covered → red already
      demand: { p1: { 10: 4 } },
      settings: { minStaffing: 0, defaultRequired: 4, allowedOverlap: 9, lockedWeeks: [] },
    });
    const warnings = evaluateCandidate(candidate(10, 10), ctx); // 1/4 — worse
    expect(warnings.filter((w) => w.kind === 'coverage-red')).toHaveLength(1);
  });

  it('unknown operator yields no warnings', () => {
    const warnings = evaluateCandidate(candidate(10, 10, 'ghost'), context());
    expect(warnings).toEqual([]);
  });
});
