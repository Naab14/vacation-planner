import { describe, expect, it } from 'vitest';
import { computeWeekCoverage, coverageLevel } from './coverage';
import type { AbsenceStatus, DemandMap, EngineAbsence, EngineOperator, EngineProcess } from './types';

const processes: EngineProcess[] = [
  { id: 'p-avsyning', name: 'Avsyning' },
  { id: 'p-serialisering', name: 'Serialisering' },
];

const settings = { defaultRequired: 2 };

function op(id: string, certifications: string[], shift = 'S1', active = true): EngineOperator {
  return { id, shift, active, certifications };
}

function absence(
  operatorId: string,
  startWeek: number,
  endWeek: number,
  status: AbsenceStatus,
): EngineAbsence {
  return { id: `a-${operatorId}-${startWeek}`, operatorId, startWeek, endWeek, status };
}

const demand: DemandMap = {
  'p-avsyning': { 10: 2 },
  'p-serialisering': { 10: 2 },
};

describe('coverageLevel', () => {
  it('is green at or above required', () => {
    expect(coverageLevel(2, 2)).toBe('green');
    expect(coverageLevel(3, 2)).toBe('green');
  });
  it('is yellow exactly one below required', () => {
    expect(coverageLevel(1, 2)).toBe('yellow');
  });
  it('is red more than one below required', () => {
    expect(coverageLevel(0, 2)).toBe('red');
  });
});

describe('computeWeekCoverage', () => {
  it('assigns single-cert operators to their process first', () => {
    const operators = [op('a', ['p-avsyning']), op('b', ['p-avsyning', 'p-serialisering'])];
    const result = computeWeekCoverage({
      operators, absences: [], processes, demand, week: 10, shift: 'S1',
      mode: 'confirmed', settings,
    });
    expect(result['p-avsyning']!.covered).toBe(1);
    // multi-cert operator goes to the emptier process
    expect(result['p-serialisering']!.covered).toBe(1);
    expect(result['p-serialisering']!.operatorsIn).toEqual(['b']);
  });

  it('sends multi-cert operators to the lowest covered/required ratio', () => {
    const operators = [
      op('a', ['p-avsyning']),
      op('b', ['p-avsyning']),
      op('c', ['p-avsyning', 'p-serialisering']),
    ];
    const result = computeWeekCoverage({
      operators, absences: [], processes, demand, week: 10, shift: 'S1',
      mode: 'confirmed', settings,
    });
    expect(result['p-serialisering']!.operatorsIn).toEqual(['c']);
  });

  it('confirmed mode counts only APPROVED absences as out', () => {
    const operators = [op('a', ['p-avsyning']), op('b', ['p-avsyning'])];
    const absences = [
      absence('a', 9, 11, 'APPROVED'),
      absence('b', 9, 11, 'REQUESTED'),
    ];
    const result = computeWeekCoverage({
      operators, absences, processes, demand, week: 10, shift: 'S1',
      mode: 'confirmed', settings,
    });
    expect(result['p-avsyning']!.covered).toBe(1);
    expect(result['p-avsyning']!.operatorsOut).toEqual(['a']);
  });

  it('projected mode also counts REQUESTED and PENDING', () => {
    const operators = [op('a', ['p-avsyning']), op('b', ['p-avsyning']), op('c', ['p-avsyning'])];
    const absences = [
      absence('a', 10, 10, 'REQUESTED'),
      absence('b', 10, 10, 'PENDING'),
      absence('c', 10, 10, 'DRAFT'), // drafts never count
    ];
    const result = computeWeekCoverage({
      operators, absences, processes, demand, week: 10, shift: 'S1',
      mode: 'projected', settings,
    });
    expect(result['p-avsyning']!.covered).toBe(1);
    expect(result['p-avsyning']!.operatorsIn).toEqual(['c']);
  });

  it('ignores inactive operators, other shifts and uncertified operators', () => {
    const operators = [
      op('a', ['p-avsyning'], 'S1', false),
      op('b', ['p-avsyning'], 'S2'),
      op('c', [], 'S1'),
    ];
    const result = computeWeekCoverage({
      operators, absences: [], processes, demand, week: 10, shift: 'S1',
      mode: 'confirmed', settings,
    });
    expect(result['p-avsyning']!.covered).toBe(0);
  });

  it('falls back to defaultRequired for weeks without demand rows', () => {
    const result = computeWeekCoverage({
      operators: [], absences: [], processes, demand: {}, week: 33, shift: 'S1',
      mode: 'confirmed', settings: { defaultRequired: 4 },
    });
    expect(result['p-avsyning']!.required).toBe(4);
  });

  it('absence outside the week does not count as out', () => {
    const operators = [op('a', ['p-avsyning'])];
    const absences = [absence('a', 11, 12, 'APPROVED')];
    const result = computeWeekCoverage({
      operators, absences, processes, demand, week: 10, shift: 'S1',
      mode: 'confirmed', settings,
    });
    expect(result['p-avsyning']!.covered).toBe(1);
  });
});
