import { describe, it, expect } from 'vitest';
import { isRangeLocked, getOverlapWarnings, buildConflictSummary } from '../conflicts';

const blocks = [
  { id: 'a', operatorId: 'op1', startWeek: 20, endWeek: 22, status: 'approved' },
  { id: 'b', operatorId: 'op2', startWeek: 21, endWeek: 21, status: 'pending' },
  { id: 'c', operatorId: 'op3', startWeek: 21, endWeek: 23, status: 'requested' },
];

describe('conflict helpers', () => {
  it('detects locked week ranges', () => {
    expect(isRangeLocked(18, 20, [20])).toBe(true);
    expect(isRangeLocked(18, 19, [20])).toBe(false);
  });

  it('warns when simultaneous absences exceed allowed overlap', () => {
    const warnings = getOverlapWarnings(blocks, { operatorId: 'op4', startWeek: 21, endWeek: 21 }, { allowedOverlap: 2 });
    expect(warnings).toContain('v.21 exceeds allowed overlap (2)');
  });

  it('builds a hard-lock conflict summary before softer warnings', () => {
    const summary = buildConflictSummary(blocks, { operatorId: 'op4', startWeek: 21, endWeek: 22 }, { allowedOverlap: 2, lockedWeeks: [22] });
    expect(summary.blocked).toBe(true);
    expect(summary.messages[0]).toBe('Week locked');
    expect(summary.messages).toContain('v.21 exceeds allowed overlap (2)');
  });

  it('warns when a candidate creates red projected coverage', () => {
    const processes = [{ id: 'serialisering', name: 'Serialisering' }];
    const operators = [
      { id: 'op1', name: 'A', shift: 'S1', active: true, certifications: ['serialisering'] },
      { id: 'op2', name: 'B', shift: 'S1', active: true, certifications: ['serialisering'] },
      { id: 'op3', name: 'C', shift: 'S1', active: true, certifications: ['serialisering'] },
    ];
    const demand = { serialisering: { 22: 4 } };

    const summary = buildConflictSummary(
      [],
      { operatorId: 'op1', startWeek: 22, endWeek: 22 },
      { allowedOverlap: 4, minStaffing: 0, shiftMode: 'combined' },
      { operators, demand, processes, holidayMap: {} },
    );

    expect(summary.messages).toContain('v.22 Serialisering would drop to RED');
    expect(summary.level).toBe('warning');
  });

  it('warns when a candidate drops a shift below minimum staffing', () => {
    const processes = [{ id: 'pack', name: 'Packning' }];
    const operators = [
      { id: 'op1', name: 'A', shift: 'S1', active: true, certifications: ['pack'] },
      { id: 'op2', name: 'B', shift: 'S1', active: true, certifications: ['pack'] },
      { id: 'op3', name: 'C', shift: 'S2', active: true, certifications: ['pack'] },
    ];

    const summary = buildConflictSummary(
      [],
      { operatorId: 'op1', startWeek: 30, endWeek: 30 },
      { allowedOverlap: 4, minStaffing: 2, shiftMode: 'separate' },
      { operators, demand: { pack: { 30: 1 } }, processes, holidayMap: {} },
    );

    expect(summary.messages).toContain('v.30 S1 below minimum staffing (1/2)');
  });
});
