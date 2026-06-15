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
});
