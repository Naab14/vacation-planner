/* Data + helpers — ported from vacation-planner */

const PROCESSES = [
  'Avsyning', 'Kapselresaren', 'Serialisering', 'Etikettering', 'Granskning/uttag av dok',
];

const SEED_OPERATORS = [
  { id: 'op1',  name: 'Anna Lindgren',   shift: 'S1', active: true, certifications: ['Avsyning','Serialisering','Granskning/uttag av dok'] },
  { id: 'op2',  name: 'Erik Holm',       shift: 'S1', active: true, certifications: ['Kapselresaren','Etikettering'] },
  { id: 'op3',  name: 'Sara Björk',      shift: 'S1', active: true, certifications: ['Avsyning','Kapselresaren','Serialisering'] },
  { id: 'op4',  name: 'Johan Nyman',     shift: 'S1', active: true, certifications: ['Serialisering','Granskning/uttag av dok'] },
  { id: 'op5',  name: 'Klara Dahl',      shift: 'S1', active: true, certifications: ['Etikettering','Avsyning'] },
  { id: 'op6',  name: 'Oscar Lund',      shift: 'S1', active: true, certifications: ['Kapselresaren','Serialisering'] },
  { id: 'op7',  name: 'Maja Ek',         shift: 'S1', active: true, certifications: ['Avsyning','Etikettering','Kapselresaren'] },
  { id: 'op8',  name: 'Lars Berg',       shift: 'S1', active: true, certifications: ['Serialisering','Etikettering'] },
  { id: 'op9',  name: 'Hanna Sjögren',   shift: 'S2', active: true, certifications: ['Avsyning','Serialisering'] },
  { id: 'op10', name: 'Emil Strand',     shift: 'S2', active: true, certifications: ['Kapselresaren','Granskning/uttag av dok'] },
  { id: 'op11', name: 'Frida Nordin',    shift: 'S2', active: true, certifications: ['Etikettering','Avsyning','Serialisering'] },
  { id: 'op12', name: 'Gustav Wallin',   shift: 'S2', active: true, certifications: ['Kapselresaren','Etikettering'] },
  { id: 'op13', name: 'Lina Åberg',      shift: 'S2', active: true, certifications: ['Avsyning','Granskning/uttag av dok'] },
  { id: 'op14', name: 'Nils Persson',    shift: 'S2', active: true, certifications: ['Serialisering','Kapselresaren'] },
  { id: 'op15', name: 'Elin Moberg',     shift: 'S2', active: true, certifications: ['Etikettering','Avsyning'] },
  { id: 'op16', name: 'Axel Svensson',   shift: 'S2', active: true, certifications: ['Kapselresaren','Serialisering','Etikettering'] },
];

const SEED_BLOCKS = [
  { id:'vb1',  operatorId:'op1',  startWeek:16, endWeek:18, status:'approved' },
  { id:'vb2',  operatorId:'op3',  startWeek:20, endWeek:22, status:'pending' },
  { id:'vb3',  operatorId:'op5',  startWeek:17, endWeek:17, status:'draft' },
  { id:'vb4',  operatorId:'op7',  startWeek:24, endWeek:26, status:'approved' },
  { id:'vb5',  operatorId:'op2',  startWeek:19, endWeek:21, status:'pending' },
  { id:'vb6',  operatorId:'op9',  startWeek:15, endWeek:16, status:'approved' },
  { id:'vb7',  operatorId:'op11', startWeek:22, endWeek:24, status:'draft' },
  { id:'vb8',  operatorId:'op14', startWeek:18, endWeek:19, status:'pending' },
  { id:'vb9',  operatorId:'op10', startWeek:25, endWeek:26, status:'approved' },
  { id:'vb10', operatorId:'op16', startWeek:20, endWeek:23, status:'requested' },
  { id:'vb11', operatorId:'op4',  startWeek:23, endWeek:25, status:'requested', dayStatuses:{} },
  { id:'vb12', operatorId:'op13', startWeek:17, endWeek:19, status:'approved' },
];

function buildDefaultDemand(){
  const d = {};
  for(const p of PROCESSES){ d[p] = {}; for(let w=1;w<=52;w++) d[p][w]=2; }
  return d;
}

const STATUSES = ['draft','pending','approved','requested'];
const STATUS_LABELS = { draft:'Utkast', pending:'Väntande', approved:'Godkänd', requested:'Begärd' };
const STATUS_DESC = {
  draft:'saved, not submitted',
  pending:'awaiting decision',
  approved:'confirmed + locked',
  requested:'operator request',
};
const SWEDISH_DAYS = ['Mån','Tis','Ons','Tor','Fre','Lör','Sön'];
const MONTHS_SV = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];

// Holidays — hardcoded sample for 2026 weeks we'll show (week 14–33)
// NOTE: real app uses date-holidays; this is a visual reskin.
const HOLIDAYS_2026 = [
  { dateStr:'2026-04-03', name:'Långfredagen' },
  { dateStr:'2026-04-05', name:'Påskdagen' },
  { dateStr:'2026-04-06', name:'Annandag påsk' },
  { dateStr:'2026-05-01', name:'Första maj' },
  { dateStr:'2026-05-14', name:'Kristi himmelsfärd' },
  { dateStr:'2026-05-24', name:'Pingstdagen' },
  { dateStr:'2026-06-06', name:'Nationaldagen' },
  { dateStr:'2026-06-19', name:'Midsommarafton' },
  { dateStr:'2026-06-20', name:'Midsommardagen' },
];

// ISO week → Monday date (year 2026)
function isoWeekMonday(year, week){
  const jan4 = new Date(Date.UTC(year,0,4));
  const jan4Day = jan4.getUTCDay() || 7; // Mon=1..Sun=7
  const mondayW1 = new Date(jan4); mondayW1.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const d = new Date(mondayW1); d.setUTCDate(mondayW1.getUTCDate() + (week-1)*7);
  return d;
}
function isoWeekDates(year, week){
  const m = isoWeekMonday(year, week);
  return Array.from({length:7},(_,i)=>{
    const d = new Date(m); d.setUTCDate(m.getUTCDate()+i); return d;
  });
}
function formatDateStr(d){
  const y=d.getUTCFullYear(), m=String(d.getUTCMonth()+1).padStart(2,'0'), day=String(d.getUTCDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

// Build holidays map keyed by ISO week number
function buildHolidayMap(){
  const m = {};
  HOLIDAYS_2026.forEach(h=>{
    const d = new Date(h.dateStr+'T00:00:00Z');
    // compute ISO week
    const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
    if(!m[weekNo]) m[weekNo] = { holidays: [] };
    m[weekNo].holidays.push(h);
  });
  return m;
}

function initials(name){
  return name.split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase();
}

window.SPData = {
  PROCESSES, SEED_OPERATORS, SEED_BLOCKS, buildDefaultDemand,
  STATUSES, STATUS_LABELS, STATUS_DESC, SWEDISH_DAYS, MONTHS_SV,
  isoWeekMonday, isoWeekDates, formatDateStr, buildHolidayMap, initials,
};
