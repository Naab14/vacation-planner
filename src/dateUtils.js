// ISO 8601 date helpers. All YYYY-MM-DD strings are compared lexicographically.

export function isoWeekDates(year, week) {
  const jan4 = new Date(year, 0, 4);
  const jan4Dow = jan4.getDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - jan4Dow + 1);
  const monday = new Date(week1Monday);
  monday.setDate(week1Monday.getDate() + (week - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function formatDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getISOWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return Math.ceil(((dt - yearStart) / 86400000 + 1) / 7);
}

export function getISOWeekMonday(year, week) {
  return formatDateStr(isoWeekDates(year, week)[0]);
}

export function getISOWeekFriday(year, week) {
  return formatDateStr(isoWeekDates(year, week)[4]);
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
  const weekDays = isoWeekDates(year, weekNum).slice(0, 5).map(formatDateStr);
  return weekDays.filter(ds => ds >= startDate && ds <= endDate).length;
}

export function formatDateLabel(dateStr) {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${d}/${m}`;
}
