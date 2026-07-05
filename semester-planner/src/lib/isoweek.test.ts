import { describe, expect, it } from 'vitest';
import { isoWeek } from './isoweek';

describe('isoWeek', () => {
  it('handles a plain mid-year date', () => {
    expect(isoWeek(new Date(2026, 6, 5))).toBe(27); // Sun 2026-07-05
  });
  it('assigns early January to the previous ISO year when applicable', () => {
    expect(isoWeek(new Date(2027, 0, 1))).toBe(53); // Fri 2027-01-01 belongs to W53 of 2026
  });
  it('week 1 starts with the year’s first Thursday', () => {
    expect(isoWeek(new Date(2026, 0, 1))).toBe(1); // Thu 2026-01-01
  });
});
