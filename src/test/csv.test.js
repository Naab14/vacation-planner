import { describe, it, expect } from 'vitest';
import { parseCSV, mergeOperators } from '../csv';

describe('parseCSV', () => {
  it('parses valid CSV with all columns', () => {
    const csv = 'Name,Shift,Certifications\nAnna,S1,Avsyning;Serialisering\nErik,S2,Etikettering';
    const { operators, error } = parseCSV(csv);
    expect(error).toBeNull();
    expect(operators).toHaveLength(2);
    expect(operators[0].name).toBe('Anna');
    expect(operators[0].shift).toBe('S1');
    expect(operators[0].certifications).toEqual(['Avsyning', 'Serialisering']);
    expect(operators[1].name).toBe('Erik');
    expect(operators[1].shift).toBe('S2');
  });

  it('returns error when no header row', () => {
    const { error } = parseCSV('');
    expect(error).toContain('header');
  });

  it('returns error when Name column is missing', () => {
    const { error } = parseCSV('Shift,Certifications\nS1,Avsyning');
    expect(error).toContain('Name');
  });

  it('defaults shift to S1 when column missing', () => {
    const csv = 'Name\nAnna';
    const { operators } = parseCSV(csv);
    expect(operators[0].shift).toBe('S1');
  });

  it('filters certifications to valid PROCESSES only', () => {
    const csv = 'Name,Shift,Certifications\nAnna,S1,Avsyning;FakeProcess;Serialisering';
    const { operators } = parseCSV(csv);
    expect(operators[0].certifications).toEqual(['Avsyning', 'Serialisering']);
    expect(operators[0].certifications).not.toContain('FakeProcess');
  });

  it('handles quoted fields with commas', () => {
    const csv = 'Name,Shift,Certifications\n"Svensson, Anna",S1,Avsyning';
    const { operators } = parseCSV(csv);
    expect(operators[0].name).toBe('Svensson, Anna');
  });

  it('uppercases shift values', () => {
    const csv = 'Name,Shift\nAnna,s2';
    const { operators } = parseCSV(csv);
    expect(operators[0].shift).toBe('S2');
  });

  it('skips rows with empty name', () => {
    const csv = 'Name,Shift\nAnna,S1\n,S2\nErik,S1';
    const { operators } = parseCSV(csv);
    expect(operators).toHaveLength(2);
  });
});

describe('mergeOperators', () => {
  const existing = [
    { id: 'op1', name: 'Anna', shift: 'S1', active: true, certifications: ['Avsyning'] },
  ];

  it('adds new operators', () => {
    const imported = [{ name: 'Erik', shift: 'S2', certifications: ['Serialisering'] }];
    const { operators, added, updated } = mergeOperators(existing, imported);
    expect(added).toBe(1);
    expect(updated).toBe(0);
    expect(operators).toHaveLength(2);
    expect(operators[1].name).toBe('Erik');
    expect(operators[1].active).toBe(true);
  });

  it('updates existing operators by case-insensitive name match', () => {
    const imported = [{ name: 'anna', shift: 'S2', certifications: ['Serialisering'] }];
    const { operators, added, updated } = mergeOperators(existing, imported);
    expect(added).toBe(0);
    expect(updated).toBe(1);
    expect(operators).toHaveLength(1);
    expect(operators[0].shift).toBe('S2');
    expect(operators[0].certifications).toEqual(['Serialisering']);
  });

  it('preserves id and active status of existing operators', () => {
    const imported = [{ name: 'Anna', shift: 'S2', certifications: [] }];
    const { operators } = mergeOperators(existing, imported);
    expect(operators[0].id).toBe('op1');
  });
});
