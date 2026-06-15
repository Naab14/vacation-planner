import { describe, expect, it } from 'vitest';
import { sanitizeSettingsPatch } from '../settings';

const current = {
  planningYear: 2026,
  visibleWeeks: 12,
  startWeek: 15,
  minStaffing: 1,
  allowedOverlap: 2,
  lockedWeeks: [],
};

describe('settings helpers', () => {
  it('clamps visible week windows so the board always has valid weeks', () => {
    const next = sanitizeSettingsPatch(current, { visibleWeeks: 80, startWeek: 52 });

    expect(next.visibleWeeks).toBe(52);
    expect(next.startWeek).toBe(1);
  });

  it('keeps previous numeric values when an input parses to NaN', () => {
    const next = sanitizeSettingsPatch(current, {
      visibleWeeks: Number.NaN,
      startWeek: Number.NaN,
      minStaffing: Number.NaN,
      allowedOverlap: Number.NaN,
    });

    expect(next.visibleWeeks).toBe(12);
    expect(next.startWeek).toBe(15);
    expect(next.minStaffing).toBe(1);
    expect(next.allowedOverlap).toBe(2);
  });

  it('clamps staffing guardrails to practical non-negative values', () => {
    const next = sanitizeSettingsPatch(current, {
      planningYear: 1900,
      minStaffing: -4,
      allowedOverlap: 50,
    });

    expect(next.planningYear).toBe(2020);
    expect(next.minStaffing).toBe(0);
    expect(next.allowedOverlap).toBe(20);
  });
});
