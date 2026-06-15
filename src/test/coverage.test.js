import { describe, it, expect } from 'vitest';
import { getCoverage, getAllCoverageForWeek } from '../coverage';
import { defaultProcesses, buildDefaultDemand } from '../schema';

const makeOp = (id, shift = 'S1', active = true, certifications = []) =>
  ({ id, name: `Op ${id}`, shift, active, certifications });

const makeBlock = (id, operatorId, startWeek, endWeek, status = 'approved') =>
  ({ id, operatorId, startWeek, endWeek, status });

const defaultDemand = buildDefaultDemand(defaultProcesses);
const emptyHolidays = {};

describe('getCoverage', () => {
  it('returns green when coverage meets demand', () => {
    const ops = [
      makeOp('1', 'S1', true, ['avsyning']),
      makeOp('2', 'S1', true, ['avsyning']),
    ];
    const result = getCoverage(ops, [], defaultDemand, 'avsyning', 10, 'combined', null, emptyHolidays);
    expect(result.covered).toBe(2);
    expect(result.required).toBe(2);
    expect(result.level).toBe('green');
  });

  it('keeps legacy process-name lookup working', () => {
    const ops = [makeOp('1', 'S1', true, ['avsyning'])];
    const result = getCoverage(ops, [], defaultDemand, 'Avsyning', 10, 'combined', null, emptyHolidays);
    expect(result.covered).toBe(1);
  });

  it('returns yellow when one short of required', () => {
    const ops = [makeOp('1', 'S1', true, ['avsyning'])];
    const result = getCoverage(ops, [], defaultDemand, 'avsyning', 10, 'combined', null, emptyHolidays);
    expect(result.covered).toBe(1);
    expect(result.level).toBe('yellow');
  });

  it('returns red when coverage is well below required', () => {
    const result = getCoverage([], [], defaultDemand, 'avsyning', 10, 'combined', null, emptyHolidays);
    expect(result.covered).toBe(0);
    expect(result.level).toBe('red');
  });

  it('excludes operators on approved vacation', () => {
    const ops = [
      makeOp('1', 'S1', true, ['avsyning']),
      makeOp('2', 'S1', true, ['avsyning']),
    ];
    const blocks = [makeBlock('b1', '1', 10, 12, 'approved')];
    const result = getCoverage(ops, blocks, defaultDemand, 'avsyning', 10, 'combined', null, emptyHolidays);
    expect(result.covered).toBe(1);
    expect(result.operatorsOut).toHaveLength(1);
    expect(result.operatorsOut[0].id).toBe('1');
  });

  it('does not exclude operators on draft/pending vacation in confirmed mode', () => {
    const ops = [makeOp('1', 'S1', true, ['avsyning'])];
    const blocks = [makeBlock('b1', '1', 10, 12, 'pending')];
    const result = getCoverage(ops, blocks, defaultDemand, 'avsyning', 10, 'combined', null, emptyHolidays);
    expect(result.covered).toBe(1);
    expect(result.operatorsOut).toHaveLength(0);
  });

  it('excludes pending and requested vacation in projected mode', () => {
    const ops = [
      makeOp('1', 'S1', true, ['avsyning']),
      makeOp('2', 'S1', true, ['avsyning']),
    ];
    const blocks = [
      makeBlock('b1', '1', 10, 12, 'pending'),
      makeBlock('b2', '2', 10, 12, 'requested'),
    ];
    const result = getCoverage(ops, blocks, defaultDemand, 'avsyning', 10, 'combined', null, emptyHolidays, defaultProcesses, 'projected');
    expect(result.covered).toBe(0);
    expect(result.operatorsOut.map(op => op.id)).toEqual(['1', '2']);
    expect(result.level).toBe('red');
  });

  it('excludes inactive operators', () => {
    const ops = [makeOp('1', 'S1', false, ['avsyning'])];
    const result = getCoverage(ops, [], defaultDemand, 'avsyning', 10, 'combined', null, emptyHolidays);
    expect(result.covered).toBe(0);
  });

  it('filters by shift in separate mode', () => {
    const ops = [
      makeOp('1', 'S1', true, ['avsyning']),
      makeOp('2', 'S2', true, ['avsyning']),
    ];
    const result = getCoverage(ops, [], defaultDemand, 'avsyning', 10, 'separate', 'S1', emptyHolidays);
    expect(result.covered).toBe(1);
    expect(result.operatorsIn).toHaveLength(1);
    expect(result.operatorsIn[0].id).toBe('1');
  });

  it('skips operators with zero certifications', () => {
    const ops = [makeOp('1', 'S1', true, [])];
    const result = getCoverage(ops, [], defaultDemand, 'avsyning', 10, 'combined', null, emptyHolidays);
    expect(result.covered).toBe(0);
  });

  it('flags holiday weeks', () => {
    const holidays = { 10: { holidays: [{ name: 'Test', dateStr: '2026-03-10' }] } };
    const result = getCoverage([], [], defaultDemand, 'avsyning', 10, 'combined', null, holidays);
    expect(result.isHoliday).toBe(true);
  });
});

describe('getAllCoverageForWeek multi-cert assignment', () => {
  it('uses process records instead of a hardcoded process list', () => {
    const processes = [{ id: 'packning', name: 'Packning' }];
    const demand = buildDefaultDemand(processes);
    const ops = [makeOp('1', 'S1', true, ['packning'])];
    const result = getAllCoverageForWeek(ops, [], demand, 10, 'combined', null, emptyHolidays, processes);
    expect(result.packning.covered).toBe(1);
    expect(result.packning.required).toBe(2);
  });

  it('assigns single-cert operators first, then multi-cert to most-needed', () => {
    const ops = [
      makeOp('1', 'S1', true, ['avsyning']),
      makeOp('2', 'S1', true, ['avsyning', 'serialisering']),
    ];
    const result = getAllCoverageForWeek(ops, [], defaultDemand, 10, 'combined', null, emptyHolidays);
    expect(result.avsyning.covered).toBe(1);
    expect(result.serialisering.covered).toBe(1);
  });

  it('handles all operators on vacation', () => {
    const ops = [makeOp('1', 'S1', true, ['avsyning'])];
    const blocks = [makeBlock('b1', '1', 1, 52, 'approved')];
    const result = getAllCoverageForWeek(ops, blocks, defaultDemand, 10, 'combined', null, emptyHolidays);
    expect(result.avsyning.covered).toBe(0);
    expect(result.avsyning.level).toBe('red');
  });

  it('returns all processes', () => {
    const result = getAllCoverageForWeek([], [], defaultDemand, 10, 'combined', null, emptyHolidays);
    for (const proc of defaultProcesses) {
      expect(result[proc.id]).toBeDefined();
      expect(result[proc.id].required).toBe(2);
    }
  });
});
