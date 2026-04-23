import { describe, it, expect } from 'vitest';
import { migrateState, defaultLeaveTypes } from '../migration';

describe('migrateState', () => {
  it('returns null for null input', () => {
    expect(migrateState(null)).toBeNull();
  });

  it('passes through already-migrated state', () => {
    const state = {
      operators: [],
      vacationBlocks: [{ id: 'b1', operatorId: 'op1', startDate: '2026-04-13', endDate: '2026-04-17', type: 'semester', status: 'draft', comment: '' }],
      settings: { leaveTypes: defaultLeaveTypes },
    };
    const result = migrateState(state);
    expect(result).toEqual(state);
  });

  it('converts week-based blocks to date-based', () => {
    const state = {
      operators: [],
      vacationBlocks: [{ id: 'b1', operatorId: 'op1', startWeek: 16, endWeek: 18, status: 'approved' }],
      settings: { shiftMode: 'separate' },
    };
    const result = migrateState(state);
    expect(result.vacationBlocks[0].startDate).toBeDefined();
    expect(result.vacationBlocks[0].endDate).toBeDefined();
    expect(result.vacationBlocks[0].startWeek).toBeUndefined();
    expect(result.vacationBlocks[0].endWeek).toBeUndefined();
  });

  it('maps old status values correctly', () => {
    const state = {
      operators: [],
      vacationBlocks: [
        { id: 'b1', operatorId: 'op1', startWeek: 16, endWeek: 18, status: 'approved' },
        { id: 'b2', operatorId: 'op2', startWeek: 20, endWeek: 22, status: 'pending' },
        { id: 'b3', operatorId: 'op3', startWeek: 24, endWeek: 26, status: 'draft' },
        { id: 'b4', operatorId: 'op4', startWeek: 28, endWeek: 30, status: 'requested' },
      ],
      settings: { leaveTypes: defaultLeaveTypes },
    };
    const result = migrateState(state);
    expect(result.vacationBlocks[0].status).toBe('beviljad');
    expect(result.vacationBlocks[1].status).toBe('ansökt');
    expect(result.vacationBlocks[2].status).toBe('draft');
    expect(result.vacationBlocks[3].status).toBe('ansökt');
  });

  it('adds default leave types when missing', () => {
    const state = {
      operators: [],
      vacationBlocks: [],
      settings: { shiftMode: 'separate' },
    };
    const result = migrateState(state);
    expect(result.settings.leaveTypes).toEqual(defaultLeaveTypes);
  });

  it('sets type to semester for migrated blocks', () => {
    const state = {
      operators: [],
      vacationBlocks: [{ id: 'b1', operatorId: 'op1', startWeek: 16, endWeek: 18, status: 'draft' }],
      settings: { leaveTypes: defaultLeaveTypes },
    };
    const result = migrateState(state);
    expect(result.vacationBlocks[0].type).toBe('semester');
  });

  it('adds empty comment to migrated blocks', () => {
    const state = {
      operators: [],
      vacationBlocks: [{ id: 'b1', operatorId: 'op1', startWeek: 16, endWeek: 18, status: 'draft' }],
      settings: { leaveTypes: defaultLeaveTypes },
    };
    const result = migrateState(state);
    expect(result.vacationBlocks[0].comment).toBe('');
  });

  it('is idempotent', () => {
    const state = {
      operators: [],
      vacationBlocks: [{ id: 'b1', operatorId: 'op1', startWeek: 16, endWeek: 18, status: 'approved' }],
      settings: { shiftMode: 'separate' },
    };
    const first = migrateState(state);
    const second = migrateState(first);
    expect(second).toEqual(first);
  });
});
