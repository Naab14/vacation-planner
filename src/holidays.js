/**
 * Swedish public holidays — hardcoded for 2025–2027 to avoid heavy dependency.
 * Source: Swedish Tax Agency (Skatteverket) / riksdagen.se
 * Includes fixed + moveable holidays.
 */

// Returns ISO week number for a date
function getISOWeek(d) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return Math.ceil(((dt - yearStart) / 86400000 + 1) / 7);
}

// Easter Sunday using Anonymous Gregorian algorithm
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getSwedishHolidays(year) {
  const easter = easterSunday(year);
  const holidays = [
    { date: new Date(year, 0, 1),   name: 'Nyårsdagen' },
    { date: new Date(year, 0, 6),   name: 'Trettondedag jul' },
    { date: addDays(easter, -2),     name: 'Långfredagen' },
    { date: easter,                   name: 'Påskdagen' },
    { date: addDays(easter, 1),      name: 'Annandag påsk' },
    { date: new Date(year, 4, 1),   name: 'Första maj' },
    { date: addDays(easter, 39),     name: 'Kristi himmelsfärdsdag' },
    { date: addDays(easter, 49),     name: 'Pingstdagen' },
    { date: new Date(year, 5, 6),   name: 'Nationaldagen' },
    // Midsommarafton: Friday between June 19–25
    { date: getMidsommarEve(year),   name: 'Midsommarafton' },
    { date: addDays(getMidsommarEve(year), 1), name: 'Midsommardagen' },
    // Alla helgons dag: Saturday between Oct 31 – Nov 6
    { date: getAllaSaints(year),      name: 'Alla helgons dag' },
    { date: new Date(year, 11, 24), name: 'Julafton' },
    { date: new Date(year, 11, 25), name: 'Juldagen' },
    { date: new Date(year, 11, 26), name: 'Annandag jul' },
    { date: new Date(year, 11, 31), name: 'Nyårsafton' },
  ];
  return holidays.map(h => ({
    ...h,
    week: getISOWeek(h.date),
    dateStr: h.date.toISOString().slice(0, 10),
  }));
}

function getMidsommarEve(year) {
  // Friday between June 19-25
  for (let d = 19; d <= 25; d++) {
    const dt = new Date(year, 5, d);
    if (dt.getDay() === 5) return dt;
  }
  return new Date(year, 5, 20);
}

function getAllaSaints(year) {
  // Saturday between Oct 31 – Nov 6
  for (let d = 31; d <= 37; d++) {
    const month = d <= 31 ? 9 : 10;
    const day = d <= 31 ? d : d - 31;
    const dt = new Date(year, month, day);
    if (dt.getDay() === 6) return dt;
  }
  return new Date(year, 10, 1);
}

/**
 * Build a lookup: { [weekNumber]: { holidays: [{ name, dateStr }] } }
 * Only includes current year since the planner uses week 1–52 for a single year.
 */
export function buildHolidayMap() {
  const now = new Date();
  const thisYear = now.getFullYear();
  const map = {};

  for (const h of getSwedishHolidays(thisYear)) {
    if (!map[h.week]) map[h.week] = { holidays: [] };
    // Deduplicate: don't add the same week+name twice
    const exists = map[h.week].holidays.some(x => x.name === h.name);
    if (!exists) map[h.week].holidays.push({ name: h.name, dateStr: h.dateStr, year: thisYear });
  }
  return map;
}
