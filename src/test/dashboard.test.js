import { describe, it, expect } from 'vitest';
import { buildDashboardSummary } from '../dashboard';
import { buildDefaultDemand } from '../schema';

const processes = [{ id: 'avsyning', name: 'Avsyning' }];
const demand = buildDefaultDemand(processes);
const operators = [
  { id: 'op1', name: 'Anna', shift: 'S1', active: true, certifications: ['avsyning'] },
  { id: 'op2', name: 'Erik', shift: 'S1', active: true, certifications: ['avsyning'] },
];

describe('buildDashboardSummary', () => {
  it('summarizes projected health and pending requests', () => {
    const vacationBlocks = [
      { id: 'a', operatorId: 'op1', startWeek: 20, endWeek: 20, status: 'pending' },
      { id: 'b', operatorId: 'op2', startWeek: 20, endWeek: 20, status: 'requested' },
    ];
    const summary = buildDashboardSummary({
      operators,
      vacationBlocks,
      demand,
      processes,
      weeks: [20, 21],
      settings: { shiftMode: 'combined' },
      holidayMap: {},
    });

    expect(summary.pendingCount).toBe(2);
    expect(summary.redWeeks).toEqual([20]);
    expect(summary.offThisWeek.map(op => op.name)).toEqual(['Anna', 'Erik']);
    expect(summary.biggestGaps[0]).toMatchObject({ week: 20, processId: 'avsyning', gap: 2 });
  });
});
