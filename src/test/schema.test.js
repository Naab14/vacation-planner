import { describe, it, expect } from 'vitest';
import {
  SCHEMA_VERSION,
  defaultProcesses,
  buildDefaultState,
  migrateState,
  processIdForName,
} from '../schema';

describe('schema migration', () => {
  it('builds a versioned default state with process records and process-id demand', () => {
    const state = buildDefaultState();
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(state.processes).toEqual(defaultProcesses);
    expect(state.demand.avsyning[1]).toBe(2);
    expect(state.operators[0].certifications).toContain('avsyning');
    expect(state.operators[0].icon).toEqual({ initials: 'AL', color: expect.any(String) });
  });

  it('migrates legacy process-name demand and certifications to process IDs', () => {
    const migrated = migrateState({
      operators: [
        { id: 'op1', name: 'Anna', shift: 'S1', active: true, certifications: ['Avsyning', 'Serialisering'] },
      ],
      vacationBlocks: [],
      demand: {
        Avsyning: { 15: 3 },
        Serialisering: { 15: 1 },
      },
      settings: { shiftMode: 'combined', visibleWeeks: 8, startWeek: 12 },
    });

    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
    expect(migrated.processes.map(p => p.id)).toEqual(defaultProcesses.map(p => p.id));
    expect(migrated.operators[0].certifications).toEqual(['avsyning', 'serialisering']);
    expect(migrated.operators[0].icon.initials).toBe('AN');
    expect(migrated.demand.avsyning[15]).toBe(3);
    expect(migrated.demand.serialisering[15]).toBe(1);
    expect(migrated.settings.shiftMode).toBe('combined');
  });

  it('keeps unknown legacy certifications as stable generated process IDs', () => {
    const migrated = migrateState({
      operators: [{ id: 'op1', name: 'Anna', shift: 'S1', active: true, certifications: ['Packning'] }],
      vacationBlocks: [],
      demand: { Packning: { 4: 5 } },
      settings: {},
    });

    expect(migrated.processes).toContainEqual({ id: 'packning', name: 'Packning' });
    expect(migrated.operators[0].certifications).toEqual(['packning']);
    expect(migrated.demand.packning[4]).toBe(5);
  });

  it('normalizes process names to stable IDs', () => {
    expect(processIdForName('Granskning/uttag av dok')).toBe('granskning-uttag-av-dok');
    expect(processIdForName('  Årlig Översyn  ')).toBe('arlig-oversyn');
  });
});
