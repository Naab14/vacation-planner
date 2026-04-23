// ── Processes / Certifications ────────────────────────────────────────────────
export const PROCESSES = [
  'Avsyning',
  'Kapselresaren',
  'Serialisering',
  'Etikettering',
  'Granskning/uttag av dok',
];

// ── Seed Operators ───────────────────────────────────────────────────────────
export const seedOperators = [
  { id: 'op1',  name: 'Anna Lindgren',   shift: 'S1', active: true, certifications: ['Avsyning', 'Serialisering', 'Granskning/uttag av dok'] },
  { id: 'op2',  name: 'Erik Holm',       shift: 'S1', active: true, certifications: ['Kapselresaren', 'Etikettering'] },
  { id: 'op3',  name: 'Sara Björk',      shift: 'S1', active: true, certifications: ['Avsyning', 'Kapselresaren', 'Serialisering'] },
  { id: 'op4',  name: 'Johan Nyman',     shift: 'S1', active: true, certifications: ['Serialisering', 'Granskning/uttag av dok'] },
  { id: 'op5',  name: 'Klara Dahl',      shift: 'S1', active: true, certifications: ['Etikettering', 'Avsyning'] },
  { id: 'op6',  name: 'Oscar Lund',      shift: 'S1', active: true, certifications: ['Kapselresaren', 'Serialisering'] },
  { id: 'op7',  name: 'Maja Ek',         shift: 'S1', active: true, certifications: ['Avsyning', 'Etikettering', 'Kapselresaren'] },
  { id: 'op8',  name: 'Lars Berg',       shift: 'S1', active: true, certifications: ['Serialisering', 'Etikettering'] },
  { id: 'op9',  name: 'Hanna Sjögren',   shift: 'S2', active: true, certifications: ['Avsyning', 'Serialisering'] },
  { id: 'op10', name: 'Emil Strand',     shift: 'S2', active: true, certifications: ['Kapselresaren', 'Granskning/uttag av dok'] },
  { id: 'op11', name: 'Frida Nordin',    shift: 'S2', active: true, certifications: ['Etikettering', 'Avsyning', 'Serialisering'] },
  { id: 'op12', name: 'Gustav Wallin',   shift: 'S2', active: true, certifications: ['Kapselresaren', 'Etikettering'] },
  { id: 'op13', name: 'Lina Åberg',      shift: 'S2', active: true, certifications: ['Avsyning', 'Granskning/uttag av dok'] },
  { id: 'op14', name: 'Nils Persson',    shift: 'S2', active: true, certifications: ['Serialisering', 'Kapselresaren'] },
  { id: 'op15', name: 'Elin Moberg',     shift: 'S2', active: true, certifications: ['Etikettering', 'Avsyning'] },
  { id: 'op16', name: 'Axel Svensson',   shift: 'S2', active: true, certifications: ['Kapselresaren', 'Serialisering', 'Etikettering'] },
];

// ── Seed Vacation Blocks (date-based) ────────────────────────────────────────
export const seedVacationBlocks = [
  { id: 'vb1',  operatorId: 'op1',  startDate: '2026-04-13', endDate: '2026-05-01', type: 'semester', status: 'beviljad', comment: '' },
  { id: 'vb2',  operatorId: 'op3',  startDate: '2026-05-11', endDate: '2026-05-29', type: 'semester', status: 'ansökt',   comment: '' },
  { id: 'vb3',  operatorId: 'op5',  startDate: '2026-04-20', endDate: '2026-04-24', type: 'komp',    status: 'draft',     comment: '' },
  { id: 'vb4',  operatorId: 'op7',  startDate: '2026-06-08', endDate: '2026-06-26', type: 'semester', status: 'beviljad', comment: '' },
  { id: 'vb5',  operatorId: 'op2',  startDate: '2026-05-04', endDate: '2026-05-22', type: 'semester', status: 'ansökt',   comment: '' },
  { id: 'vb6',  operatorId: 'op9',  startDate: '2026-04-06', endDate: '2026-04-17', type: 'semester', status: 'beviljad', comment: '' },
  { id: 'vb7',  operatorId: 'op11', startDate: '2026-05-25', endDate: '2026-06-12', type: 'semester', status: 'draft',    comment: '' },
  { id: 'vb8',  operatorId: 'op14', startDate: '2026-04-27', endDate: '2026-05-08', type: 'vab',     status: 'ansökt',   comment: 'Väntar på besked' },
  { id: 'vb9',  operatorId: 'op10', startDate: '2026-06-15', endDate: '2026-06-26', type: 'semester', status: 'beviljad', comment: '' },
  { id: 'vb10', operatorId: 'op16', startDate: '2026-05-11', endDate: '2026-06-05', type: 'semester', status: 'draft',    comment: '' },
];

// ── Default Demand (2 per process per week across 52 weeks) ──────────────────
export function buildDefaultDemand() {
  const d = {};
  for (const p of PROCESSES) {
    d[p] = {};
    for (let w = 1; w <= 52; w++) d[p][w] = 2;
  }
  return d;
}

// ── Default Leave Types ─────────────────────────────────────────────────────
export const defaultLeaveTypes = [
  { id: 'semester', label: 'Semester', color: '#22c55e' },
  { id: 'vab', label: 'VAB', color: '#3b82f6' },
  { id: 'sjuk', label: 'Sjukdag', color: '#f43f5e' },
  { id: 'komp', label: 'Kompledigt', color: '#a855f7' },
];

// ── Default Settings ─────────────────────────────────────────────────────────
export const defaultSettings = {
  shiftMode: 'separate',
  visibleWeeks: 12,
  startWeek: 15,
  leaveTypes: defaultLeaveTypes,
};

// ── Themes ───────────────────────────────────────────────────────────────────
export const themes = [
  { id: 'default', label: 'Default' },
  { id: 'motherduck', label: 'MotherDuck' },
  { id: 'dark', label: 'Dark' },
  { id: 'ocean', label: 'Ocean' },
];
