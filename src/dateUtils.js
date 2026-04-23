export function getISOWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return Math.ceil(((dt - yearStart) / 86400000 + 1) / 7);
}

export function getISOWeekMonday(year, week) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
  return fmtDate(monday);
}

export function getISOWeekFriday(year, week) {
  const mon = getISOWeekMonday(year, week);
  const [y, m, d] = mon.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 4));
  return fmtDate(dt);
}

export function isoWeekDates(year, week) {
  const mon = getISOWeekMonday(year, week);
  const [y, m, d] = mon.split('-').map(Number);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(fmtDate(new Date(Date.UTC(y, m - 1, d + i))));
  }
  return dates;
}

export function datesOverlap(startA, endA, startB, endB) {
  return startA <= endB && startB <= endA;
}

export function blockCoversDate(block, dateStr) {
  return dateStr >= block.startDate && dateStr <= block.endDate;
}

export function blockCoversWeek(block, weekNum, year) {
  const mon = getISOWeekMonday(year, weekNum);
  const fri = getISOWeekFriday(year, weekNum);
  return datesOverlap(block.startDate, block.endDate, mon, fri);
}

export function getWorkdaysInWeek(startDate, endDate, weekNum, year) {
  const mon = getISOWeekMonday(year, weekNum);
  const [y, m, d] = mon.split('-').map(Number);
  let count = 0;
  for (let i = 0; i < 5; i++) {
    const ds = fmtDate(new Date(Date.UTC(y, m - 1, d + i)));
    if (ds >= startDate && ds <= endDate) count++;
  }
  return count;
}

export function formatDateLabel(dateStr) {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${d}/${m}`;
}

function fmtDate(dt) {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
