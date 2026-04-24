import { isoWeekDates, formatDateStr } from './dateUtils';

export const DEFAULT_HOURS_PER_DAY = 8;
export const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5];
export const TRACKED_STATUSES = ['draft', 'pending', 'approved', 'requested'];

function dayOfWeekIso(d) {
  return d.getDay() === 0 ? 7 : d.getDay();
}

function isHolidayDate(dateStr, weekNumber, holidayMap) {
  const entry = holidayMap?.[weekNumber];
  if (!entry?.holidays?.length) return false;
  return entry.holidays.some(h => h.dateStr === dateStr);
}

function emptyHoursByStatus() {
  const out = { total: 0 };
  for (const s of TRACKED_STATUSES) out[s] = 0;
  return out;
}

export function getBusinessDaysInWeek(year, weekNumber, holidayMap = {}, workDays = DEFAULT_WORK_DAYS) {
  const workDaySet = new Set(workDays);
  return isoWeekDates(year, weekNumber)
    .filter(d => workDaySet.has(dayOfWeekIso(d)))
    .map(d => formatDateStr(d))
    .filter(ds => !isHolidayDate(ds, weekNumber, holidayMap));
}

export function getBlockWorkDays(block, year, holidayMap = {}, workDays = DEFAULT_WORK_DAYS) {
  const out = [];
  for (let w = block.startWeek; w <= block.endWeek; w++) {
    for (const dateStr of getBusinessDaysInWeek(year, w, holidayMap, workDays)) {
      const status = block.dayStatuses?.[dateStr] ?? block.status;
      out.push({ dateStr, week: w, status });
    }
  }
  return out;
}

export function getBlockHours(block, year, holidayMap = {}, config = {}) {
  const hoursPerDay = config.hoursPerDay ?? DEFAULT_HOURS_PER_DAY;
  const workDays = config.workDays ?? DEFAULT_WORK_DAYS;
  const days = getBlockWorkDays(block, year, holidayMap, workDays);
  const out = emptyHoursByStatus();
  for (const d of days) {
    if (!TRACKED_STATUSES.includes(d.status)) continue;
    out[d.status] += hoursPerDay;
    out.total += hoursPerDay;
  }
  return out;
}

export function getOperatorVacationHours(operatorId, blocks, year, periodStart, periodEnd, holidayMap = {}, config = {}) {
  const totals = emptyHoursByStatus();
  const keys = Object.keys(totals);
  for (const block of blocks) {
    if (block.operatorId !== operatorId) continue;
    if (block.endWeek < periodStart || block.startWeek > periodEnd) continue;
    const clipped = {
      ...block,
      startWeek: Math.max(block.startWeek, periodStart),
      endWeek: Math.min(block.endWeek, periodEnd),
    };
    const h = getBlockHours(clipped, year, holidayMap, config);
    for (const k of keys) totals[k] += h[k];
  }
  return totals;
}

/**
 * Planned rota hours for one operator's schedule across the period.
 * If `config.plannedHoursPerWeek` is set, uses that as a flat rota baseline.
 * Otherwise falls back to (business days per week) × hoursPerDay.
 */
export function getPlannedHours(year, periodStart, periodEnd, holidayMap = {}, config = {}) {
  if (typeof config.plannedHoursPerWeek === 'number') {
    return (periodEnd - periodStart + 1) * config.plannedHoursPerWeek;
  }
  const hoursPerDay = config.hoursPerDay ?? DEFAULT_HOURS_PER_DAY;
  const workDays = config.workDays ?? DEFAULT_WORK_DAYS;
  let hours = 0;
  for (let w = periodStart; w <= periodEnd; w++) {
    hours += getBusinessDaysInWeek(year, w, holidayMap, workDays).length * hoursPerDay;
  }
  return hours;
}

export function getTrackingSummary(operators, blocks, year, options = {}) {
  const periodStart = options.periodStart ?? 1;
  const periodEnd = options.periodEnd ?? 52;
  const holidayMap = options.holidayMap ?? {};
  const includeInactive = options.includeInactive ?? false;
  const config = {
    hoursPerDay: options.hoursPerDay,
    workDays: options.workDays,
    plannedHoursPerWeek: options.plannedHoursPerWeek,
  };
  const plannedHours = getPlannedHours(year, periodStart, periodEnd, holidayMap, config);
  return operators
    .filter(op => includeInactive || op.active)
    .map(op => {
      const vacationHours = getOperatorVacationHours(op.id, blocks, year, periodStart, periodEnd, holidayMap, config);
      return {
        operatorId: op.id,
        operatorName: op.name,
        shift: op.shift,
        plannedHours,
        vacationHours,
        netHours: plannedHours - vacationHours.total,
      };
    });
}
