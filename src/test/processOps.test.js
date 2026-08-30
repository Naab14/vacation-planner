import { describe, it, expect } from 'vitest';
import { addProcess, renameProcess, removeProcess, toggleCertification } from '../processOps';

const baseState = () => ({
  processes: ['Avsyning', 'Serialisering'],
  operators: [
    { id: 'op1', name: 'A', certifications: ['Avsyning'] },
    { id: 'op2', name: 'B', certifications: ['Serialisering'] },
  ],
  demand: { Avsyning: { 1: 2 }, Serialisering: { 1: 2 } },
  settings: { defaultRequired: 3 },
});

describe('addProcess', () => {
  it('adds a process with a full demand column at defaultRequired', () => {
    const s = addProcess(baseState(), 'Etikettering');
    expect(s.processes).toContain('Etikettering');
    expect(s.demand.Etikettering[1]).toBe(3);
    expect(Object.keys(s.demand.Etikettering)).toHaveLength(52);
  });
  it('ignores blank or duplicate names', () => {
    const s = baseState();
    expect(addProcess(s, '   ')).toBe(s);
    expect(addProcess(s, 'Avsyning')).toBe(s);
  });
});

describe('renameProcess', () => {
  it('cascades to demand keys and operator certifications', () => {
    const s = renameProcess(baseState(), 'Avsyning', 'Visuell');
    expect(s.processes).toEqual(['Visuell', 'Serialisering']);
    expect(s.demand.Visuell).toBeDefined();
    expect(s.demand.Avsyning).toBeUndefined();
    expect(s.operators[0].certifications).toEqual(['Visuell']);
  });
  it('refuses to collide with an existing name', () => {
    const s = baseState();
    expect(renameProcess(s, 'Avsyning', 'Serialisering')).toBe(s);
  });
});

describe('removeProcess', () => {
  it('removes from processes, demand, and certifications', () => {
    const s = removeProcess(baseState(), 'Avsyning');
    expect(s.processes).toEqual(['Serialisering']);
    expect(s.demand.Avsyning).toBeUndefined();
    expect(s.operators[0].certifications).toEqual([]);
  });
});

describe('toggleCertification', () => {
  it('adds then removes a certification for one operator', () => {
    let s = toggleCertification(baseState(), 'op1', 'Serialisering');
    expect(s.operators[0].certifications).toContain('Serialisering');
    s = toggleCertification(s, 'op1', 'Serialisering');
    expect(s.operators[0].certifications).not.toContain('Serialisering');
  });
});
