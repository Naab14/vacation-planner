export const SCHEMA_VERSION = 2;
export const DEFAULT_REQUIRED = 2;

export const defaultProcesses = [
  { id: 'avsyning', name: 'Avsyning' },
  { id: 'kapselresaren', name: 'Kapselresaren' },
  { id: 'serialisering', name: 'Serialisering' },
  { id: 'etikettering', name: 'Etikettering' },
  { id: 'granskning-uttag-av-dok', name: 'Granskning/uttag av dok' },
];

export const defaultSettings = {
  planningYear: new Date().getFullYear(),
  shiftMode: 'separate',
  visibleWeeks: 12,
  startWeek: 15,
  minStaffing: 1,
  allowedOverlap: 2,
  defaultRequired: DEFAULT_REQUIRED,
  lockedWeeks: [],
  holidaysRegion: 'SE',
  colorCoding: {
    greenAt: 1,
    yellowWithin: 1,
  },
};

export const seedOperators = [
  { id: 'op1',  name: 'Anna Lindgren',   shift: 'S1', active: true, certifications: ['avsyning', 'serialisering', 'granskning-uttag-av-dok'] },
  { id: 'op2',  name: 'Erik Holm',       shift: 'S1', active: true, certifications: ['kapselresaren', 'etikettering'] },
  { id: 'op3',  name: 'Sara Björk',      shift: 'S1', active: true, certifications: ['avsyning', 'kapselresaren', 'serialisering'] },
  { id: 'op4',  name: 'Johan Nyman',     shift: 'S1', active: true, certifications: ['serialisering', 'granskning-uttag-av-dok'] },
  { id: 'op5',  name: 'Klara Dahl',      shift: 'S1', active: true, certifications: ['etikettering', 'avsyning'] },
  { id: 'op6',  name: 'Oscar Lund',      shift: 'S1', active: true, certifications: ['kapselresaren', 'serialisering'] },
  { id: 'op7',  name: 'Maja Ek',         shift: 'S1', active: true, certifications: ['avsyning', 'etikettering', 'kapselresaren'] },
  { id: 'op8',  name: 'Lars Berg',       shift: 'S1', active: true, certifications: ['serialisering', 'etikettering'] },
  { id: 'op9',  name: 'Hanna Sjögren',   shift: 'S2', active: true, certifications: ['avsyning', 'serialisering'] },
  { id: 'op10', name: 'Emil Strand',     shift: 'S2', active: true, certifications: ['kapselresaren', 'granskning-uttag-av-dok'] },
  { id: 'op11', name: 'Frida Nordin',    shift: 'S2', active: true, certifications: ['etikettering', 'avsyning', 'serialisering'] },
  { id: 'op12', name: 'Gustav Wallin',   shift: 'S2', active: true, certifications: ['kapselresaren', 'etikettering'] },
  { id: 'op13', name: 'Lina Åberg',      shift: 'S2', active: true, certifications: ['avsyning', 'granskning-uttag-av-dok'] },
  { id: 'op14', name: 'Nils Persson',    shift: 'S2', active: true, certifications: ['serialisering', 'kapselresaren'] },
  { id: 'op15', name: 'Elin Moberg',     shift: 'S2', active: true, certifications: ['etikettering', 'avsyning'] },
  { id: 'op16', name: 'Axel Svensson',   shift: 'S2', active: true, certifications: ['kapselresaren', 'serialisering', 'etikettering'] },
];

export const seedVacationBlocks = [
  { id: 'vb1',  operatorId: 'op1',  startWeek: 16, endWeek: 18, status: 'approved' },
  { id: 'vb2',  operatorId: 'op3',  startWeek: 20, endWeek: 22, status: 'pending' },
  { id: 'vb3',  operatorId: 'op5',  startWeek: 17, endWeek: 17, status: 'draft' },
  { id: 'vb4',  operatorId: 'op7',  startWeek: 24, endWeek: 26, status: 'approved' },
  { id: 'vb5',  operatorId: 'op2',  startWeek: 19, endWeek: 21, status: 'pending' },
  { id: 'vb6',  operatorId: 'op9',  startWeek: 15, endWeek: 16, status: 'approved' },
  { id: 'vb7',  operatorId: 'op11', startWeek: 22, endWeek: 24, status: 'draft' },
  { id: 'vb8',  operatorId: 'op14', startWeek: 18, endWeek: 19, status: 'pending' },
  { id: 'vb9',  operatorId: 'op10', startWeek: 25, endWeek: 26, status: 'approved' },
  { id: 'vb10', operatorId: 'op16', startWeek: 20, endWeek: 23, status: 'draft' },
];

const iconColors = ['#4f46e5', '#0284c7', '#059669', '#d97706', '#db2777', '#7c3aed', '#0891b2', '#be123c'];

export function buildOperatorIcon(name, index = 0) {
  const seed = Array.from(String(name || '')).reduce((sum, ch) => sum + ch.charCodeAt(0), index);
  return { color: iconColors[Math.abs(seed) % iconColors.length] };
}

export function getOperatorInitials(name) {
  const words = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (words.length >= 2 ? `${words[0][0]}${words[1][0]}` : (words[0]?.slice(0, 2) || '?')).toUpperCase();
}

export function processIdForName(name) {
  return String(name || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'process';
}

function buildProcessLookup(processes) {
  const lookup = new Map();
  processes.forEach(process => {
    lookup.set(process.id.toLowerCase(), process.id);
    lookup.set(process.name.toLowerCase(), process.id);
  });
  return lookup;
}

function uniqueProcesses(inputProcesses, legacyState) {
  const processes = [];
  const seen = new Set();
  const addProcess = process => {
    const name = typeof process === 'string' ? process : process?.name;
    const id = typeof process === 'string' ? processIdForName(process) : (process?.id || processIdForName(name));
    if (!name || seen.has(id)) return;
    seen.add(id);
    processes.push({ id, name });
  };

  (Array.isArray(inputProcesses) && inputProcesses.length ? inputProcesses : defaultProcesses).forEach(addProcess);
  Object.keys(legacyState?.demand || {}).forEach(name => addProcess(name));
  (legacyState?.operators || []).forEach(op => (op.certifications || []).forEach(cert => addProcess(cert)));
  return processes;
}

export function buildDefaultDemand(processes = defaultProcesses, value = DEFAULT_REQUIRED) {
  const demand = {};
  processes.forEach(process => {
    demand[process.id] = {};
    for (let week = 1; week <= 52; week++) demand[process.id][week] = value;
  });
  return demand;
}

export function migrateState(rawState) {
  if (!rawState) return buildDefaultState();
  const processes = uniqueProcesses(rawState.processes, rawState);
  const lookup = buildProcessLookup(processes);
  const mapProcessId = token => {
    if (!token) return null;
    const key = String(token).toLowerCase();
    return lookup.get(key) || processIdForName(token);
  };

  const demand = buildDefaultDemand(processes);
  Object.entries(rawState.demand || {}).forEach(([processKey, weeks]) => {
    const processId = mapProcessId(processKey);
    if (!processId) return;
    demand[processId] = { ...(demand[processId] || {}) };
    Object.entries(weeks || {}).forEach(([week, value]) => {
      demand[processId][week] = Number(value) || 0;
    });
  });

  return {
    schemaVersion: SCHEMA_VERSION,
    processes,
    operators: (rawState.operators || seedOperators).map((op, index) => ({
      ...op,
      active: op.active !== false,
      icon: { color: op.icon?.color || buildOperatorIcon(op.name, index).color },
      certifications: Array.from(new Set((op.certifications || []).map(mapProcessId).filter(Boolean))),
    })),
    vacationBlocks: rawState.vacationBlocks || seedVacationBlocks,
    demand,
    teams: rawState.teams || [],
    settings: {
      ...defaultSettings,
      ...(rawState.settings || {}),
    },
  };
}

export function buildDefaultState() {
  return migrateState({
    schemaVersion: SCHEMA_VERSION,
    processes: defaultProcesses,
    operators: seedOperators,
    vacationBlocks: seedVacationBlocks,
    demand: buildDefaultDemand(defaultProcesses),
    teams: [],
    settings: defaultSettings,
  });
}
