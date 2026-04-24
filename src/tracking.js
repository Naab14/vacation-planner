import { isoWeekDates, formatDateStr, getISOWeek } from './dateUtils';

export const DEFAULT_HOURS_PER_DAY = 8;
export const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5];
export const TRACKED_STATUSES = ['draft', 'ansökt', 'beviljad'];

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
  const startW = getISOWeek(block.startDate);
  const endW = getISOWeek(block.endDate);
  for (let w = startW; w <= endW; w++) {
    for (const dateStr of getBusinessDaysInWeek(year, w, holidayMap, workDays)) {
      if (dateStr < block.startDate || dateStr > block.endDate) continue;
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
    if (config.periodStart != null && d.week < config.periodStart) continue;
    if (config.periodEnd != null && d.week > config.periodEnd) continue;
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
    const bStart = getISOWeek(block.startDate);
    const bEnd = getISOWeek(block.endDate);
    if (bEnd < periodStart || bStart > periodEnd) continue;
    const h = getBlockHours(block, year, holidayMap, {
      ...config,
      periodStart,
      periodEnd,
    });
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
