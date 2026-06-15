import { describe, it, expect } from 'vitest';
import { migrateState, freshState } from '../store';
import { SCHEMA_VERSION, PROCESSES } from '../data';

describe('migrateState', () => {
  it('injects a process list and demand columns for v1 data', () => {
    const v1 = {
      operators: [{ id: 'op1', name: 'A', certifications: ['Avsyning'] }],
      vacationBlocks: [],
      demand: {},
      settings: { shiftMode: 'separate', visibleWeeks: 12, startWeek: 15 },
    };
    const m = migrateState(v1);
    expect(m.processes).toEqual(PROCESSES);
    expect(m.schemaVersion).toBe(SCHEMA_VERSION);
    PROCESSES.forEach(p => expect(Object.keys(m.demand[p])).toHaveLength(52));
  });

  it('recovers the process list from existing demand keys', () => {
    const m = migrateState({ demand: { Foo: { 1: 2 }, Bar: { 1: 2 } }, settings: {} });
    expect(m.processes).toEqual(['Foo', 'Bar']);
  });

  it('backfills new settings fields without clobbering existing ones', () => {
    const m = migrateState({ settings: { startWeek: 20 }, demand: {} });
    expect(m.settings.startWeek).toBe(20);
    expect(m.settings.planningYear).toBeDefined();
    expect(Array.isArray(m.settings.lockedWeeks)).toBe(true);
  });

  it('is idempotent', () => {
    const once = migrateState({ demand: {}, settings: {} });
    const twice = migrateState(once);
    expect(twice).toEqual(once);
  });
});

describe('freshState', () => {
  it('builds a valid current-schema workspace', () => {
    const s = freshState();
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.processes).toEqual(PROCESSES);
    expect(s.demand[PROCESSES[0]][1]).toBe(s.settings.defaultRequired);
  });
});
