import { describe, it, expect } from 'vitest';
import {
  getISOWeek, getISOWeekMonday, getISOWeekFriday, isoWeekDates,
  datesOverlap, blockCoversDate, blockCoversWeek, getWorkdaysInWeek, formatDateLabel,
} from '../dateUtils';

describe('getISOWeek', () => {
  it('returns 1 for Jan 1 2026', () => {
    expect(getISOWeek('2026-01-01')).toBe(1);
  });

  it('returns 53 for Dec 31 2026 (ISO week 53 or 1 of next year)', () => {
    const w = getISOWeek('2026-12-31');
    expect(w).toBeGreaterThanOrEqual(1);
  });

  it('returns correct week for known date', () => {
    expect(getISOWeek('2026-06-15')).toBe(25);
  });
});

describe('getISOWeekMonday / getISOWeekFriday', () => {
  it('returns Monday of week 1 2026', () => {
    expect(getISOWeekMonday(2026, 1)).toBe('2025-12-29');
  });

  it('returns Friday of week 1 2026', () => {
    expect(getISOWeekFriday(2026, 1)).toBe('2026-01-02');
  });

  it('Monday is always before Friday', () => {
    for (let w = 1; w <= 52; w++) {
      expect(getISOWeekMonday(2026, w) < getISOWeekFriday(2026, w)).toBe(true);
    }
  });
});

describe('isoWeekDates', () => {
  it('returns 7 dates', () => {
    expect(isoWeekDates(2026, 15).length).toBe(7);
  });

  it('starts on Monday', () => {
    const dates = isoWeekDates(2026, 15);
    const dt = new Date(dates[0] + 'T00:00:00Z');
    expect(dt.getUTCDay()).toBe(1);
  });
});

describe('datesOverlap', () => {
  it('detects overlap', () => {
    expect(datesOverlap('2026-04-10', '2026-04-20', '2026-04-15', '2026-04-25')).toBe(true);
  });

  it('detects no overlap', () => {
    expect(datesOverlap('2026-04-10', '2026-04-14', '2026-04-15', '2026-04-25')).toBe(false);
  });

  it('detects touching dates as overlap', () => {
    expect(datesOverlap('2026-04-10', '2026-04-15', '2026-04-15', '2026-04-20')).toBe(true);
  });
});

describe('blockCoversDate', () => {
  const block = { startDate: '2026-04-13', endDate: '2026-04-17' };

  it('returns true for date within block', () => {
    expect(blockCoversDate(block, '2026-04-15')).toBe(true);
  });

  it('returns true for start date', () => {
    expect(blockCoversDate(block, '2026-04-13')).toBe(true);
  });

  it('returns false for date outside block', () => {
    expect(blockCoversDate(block, '2026-04-12')).toBe(false);
  });
});

describe('blockCoversWeek', () => {
  const block = { startDate: '2026-04-13', endDate: '2026-04-24' };

  it('returns true for week fully within block', () => {
    expect(blockCoversWeek(block, 16, 2026)).toBe(true);
  });

  it('returns true for week partially covered', () => {
    expect(blockCoversWeek(block, 17, 2026)).toBe(true);
  });

  it('returns false for week not covered', () => {
    expect(blockCoversWeek(block, 14, 2026)).toBe(false);
  });
});

describe('getWorkdaysInWeek', () => {
  it('returns 5 for full week coverage', () => {
    expect(getWorkdaysInWeek('2026-04-06', '2026-04-10', 15, 2026)).toBe(5);
  });

  it('returns partial days for partial week', () => {
    const days = getWorkdaysInWeek('2026-04-08', '2026-04-10', 15, 2026);
    expect(days).toBeGreaterThan(0);
    expect(days).toBeLessThan(5);
  });
});

describe('formatDateLabel', () => {
  it('formats date as d/m', () => {
    expect(formatDateLabel('2026-04-14')).toBe('14/4');
  });

  it('handles single-digit day/month', () => {
    expect(formatDateLabel('2026-01-05')).toBe('5/1');
  });
});
