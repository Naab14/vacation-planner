import { describe, it, expect } from 'vitest';
import {
  DEFAULT_HOURS_PER_DAY,
  getBusinessDaysInWeek,
  getBlockWorkDays,
  getBlockHours,
  getOperatorVacationHours,
  getPlannedHours,
  getTrackingSummary,
} from '../tracking';
import { getISOWeekMonday, getISOWeekFriday } from '../dateUtils';

const YEAR = 2026;

// Week 16 of 2026 is 2026-04-13 (Mon) through 2026-04-19 (Sun) — no Swedish holidays.
// Week 14 of 2026 contains Påskdagen (Easter) area; use a stub holiday map for tests.

const emptyHolidayMap = {};

const holidayMapWithFriday16 = {
  16: { holidays: [{ name: 'Stubbday', dateStr: '2026-04-17' }] },
};

const mkBlock = (id, operatorId, startWeek, endWeek, status = 'beviljad', extra = {}) => ({
  id, operatorId,
  startDate: getISOWeekMonday(YEAR, startWeek),
  endDate: getISOWeekFriday(YEAR, endWeek),
  status,
  ...extra,
});

describe('getBusinessDaysInWeek', () => {
  it('returns five weekday ISO dates for a non-holiday week', () => {
    const days = getBusinessDaysInWeek(YEAR, 16, emptyHolidayMap);
    expect(days).toEqual([
      '2026-04-13',
      '2026-04-14',
      '2026-04-15',
      '2026-04-16',
      '2026-04-17',
    ]);
  });

  it('excludes weekends by default', () => {
    const days = getBusinessDaysInWeek(YEAR, 16, emptyHolidayMap);
    expect(days).not.toContain('2026-04-18');
    expect(days).not.toContain('2026-04-19');
  });

  it('excludes holiday dates', () => {
    const days = getBusinessDaysInWeek(YEAR, 16, holidayMapWithFriday16);
    expect(days).toEqual([
      '2026-04-13',
      '2026-04-14',
      '2026-04-15',
      '2026-04-16',
    ]);
  });

  it('respects a custom workDays list', () => {
    const days = getBusinessDaysInWeek(YEAR, 16, emptyHolidayMap, [6, 7]);
    expect(days).toEqual(['2026-04-18', '2026-04-19']);
  });
});

describe('getBlockWorkDays', () => {
  it('returns a day entry per business day in the block range', () => {
    const block = mkBlock('vb', 'op1', 16, 16, 'beviljad');
    const days = getBlockWorkDays(block, YEAR, emptyHolidayMap);
    expect(days).toHaveLength(5);
    expect(days[0]).toEqual({ dateStr: '2026-04-13', week: 16, status: 'beviljad' });
  });

  it('spans multiple weeks', () => {
    const block = mkBlock('vb', 'op1', 16, 17, 'beviljad');
    const days = getBlockWorkDays(block, YEAR, emptyHolidayMap);
    expect(days).toHaveLength(10);
    expect(days.every(d => d.status === 'beviljad')).toBe(true);
  });

  it('uses dayStatuses overrides when present', () => {
    const block = mkBlock('vb', 'op1', 16, 16, 'beviljad', {
      dayStatuses: { '2026-04-15': 'ansökt' },
    });
    const days = getBlockWorkDays(block, YEAR, emptyHolidayMap);
    const wednesday = days.find(d => d.dateStr === '2026-04-15');
    expect(wednesday.status).toBe('ansökt');
    const monday = days.find(d => d.dateStr === '2026-04-13');
    expect(monday.status).toBe('beviljad');
  });
});

describe('getBlockHours', () => {
  it('converts workdays to hours using hoursPerDay', () => {
    const block = mkBlock('vb', 'op1', 16, 16, 'beviljad');
    const h = getBlockHours(block, YEAR, emptyHolidayMap);
    expect(h.beviljad).toBe(5 * DEFAULT_HOURS_PER_DAY);
    expect(h.total).toBe(5 * DEFAULT_HOURS_PER_DAY);
    expect(h.ansökt).toBe(0);
  });

  it('groups hours by effective status when dayStatuses override', () => {
    const block = mkBlock('vb', 'op1', 16, 16, 'beviljad', {
      dayStatuses: { '2026-04-13': 'ansökt', '2026-04-14': 'ansökt' },
    });
    const h = getBlockHours(block, YEAR, emptyHolidayMap);
    expect(h.ansökt).toBe(16);
    expect(h.beviljad).toBe(24);
    expect(h.total).toBe(40);
  });

  it('honors a custom hoursPerDay', () => {
    const block = mkBlock('vb', 'op1', 16, 16, 'beviljad');
    const h = getBlockHours(block, YEAR, emptyHolidayMap, { hoursPerDay: 12 });
    expect(h.beviljad).toBe(60);
  });

  it('ignores days whose status is not a tracked status', () => {
    const block = mkBlock('vb', 'op1', 16, 16, 'unknown');
    const h = getBlockHours(block, YEAR, emptyHolidayMap);
    expect(h.total).toBe(0);
  });
});

describe('getOperatorVacationHours', () => {
  const blocks = [
    mkBlock('vb1', 'op1', 16, 16, 'beviljad'),
    mkBlock('vb2', 'op1', 20, 20, 'ansökt'),
    mkBlock('vb3', 'op2', 16, 16, 'beviljad'),
  ];

  it('aggregates hours for one operator across multiple blocks', () => {
    const h = getOperatorVacationHours('op1', blocks, YEAR, 1, 52, emptyHolidayMap);
    expect(h.beviljad).toBe(40);
    expect(h.ansökt).toBe(40);
    expect(h.total).toBe(80);
  });

  it('clips blocks to the period window', () => {
    const multiWeek = [mkBlock('vb', 'op1', 15, 20, 'beviljad')];
    const h = getOperatorVacationHours('op1', multiWeek, YEAR, 16, 17, emptyHolidayMap);
    expect(h.beviljad).toBe(80);
  });

  it('excludes blocks wholly outside the period', () => {
    const h = getOperatorVacationHours('op1', blocks, YEAR, 30, 40, emptyHolidayMap);
    expect(h.total).toBe(0);
  });
});

describe('getPlannedHours', () => {
  it('sums business days × hoursPerDay across the period by default', () => {
    const planned = getPlannedHours(YEAR, 16, 16, emptyHolidayMap);
    expect(planned).toBe(40);
  });

  it('uses plannedHoursPerWeek as a flat rota baseline when provided', () => {
    const planned = getPlannedHours(YEAR, 16, 19, emptyHolidayMap, { plannedHoursPerWeek: 36 });
    expect(planned).toBe(36 * 4);
  });

  it('subtracts holidays from the default calculation', () => {
    const planned = getPlannedHours(YEAR, 16, 16, holidayMapWithFriday16);
    expect(planned).toBe(32);
  });
});

describe('getTrackingSummary', () => {
  const operators = [
    { id: 'op1', name: 'Anna', shift: 'S1', active: true, certifications: [] },
    { id: 'op2', name: 'Erik', shift: 'S1', active: false, certifications: [] },
  ];
  const blocks = [mkBlock('vb1', 'op1', 16, 16, 'beviljad')];

  it('produces one row per active operator by default', () => {
    const rows = getTrackingSummary(operators, blocks, YEAR, { periodStart: 16, periodEnd: 16 });
    expect(rows).toHaveLength(1);
    expect(rows[0].operatorId).toBe('op1');
  });

  it('computes plannedHours, vacationHours, and netHours per row', () => {
    const rows = getTrackingSummary(operators, blocks, YEAR, { periodStart: 16, periodEnd: 16 });
    expect(rows[0].plannedHours).toBe(40);
    expect(rows[0].vacationHours.beviljad).toBe(40);
    expect(rows[0].netHours).toBe(0);
  });

  it('includes inactive operators when requested', () => {
    const rows = getTrackingSummary(operators, blocks, YEAR, {
      periodStart: 16,
      periodEnd: 16,
      includeInactive: true,
    });
    expect(rows).toHaveLength(2);
  });
});
