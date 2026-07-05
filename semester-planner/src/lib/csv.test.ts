import { describe, expect, it } from 'vitest';
import { csvEscape, toCsv } from './csv';

describe('csvEscape', () => {
  it('passes plain values through', () => {
    expect(csvEscape('Avsyning')).toBe('Avsyning');
    expect(csvEscape(42)).toBe('42');
  });
  it('renders null/undefined as empty', () => {
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(undefined)).toBe('');
  });
  it('quotes commas, quotes and newlines', () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape('two\nlines')).toBe('"two\nlines"');
  });
});

describe('toCsv', () => {
  it('joins headers and rows with CRLF and a trailing newline', () => {
    const csv = toCsv(['name', 'weeks'], [['Anna, B', 2], ['Cesar', 1]]);
    expect(csv).toBe('name,weeks\r\n"Anna, B",2\r\nCesar,1\r\n');
  });
});
