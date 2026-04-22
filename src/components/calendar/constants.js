export const CELL_W = 68;
export const CELL_H = 32;
export const LABEL_W = 130;

export const STATUS_COLORS = {
  draft:     { bg: 'var(--st-draft-bg)',    border: 'var(--st-draft-bd)' },
  pending:   { bg: 'var(--st-pending-bg)',  border: 'var(--st-pending-bd)' },
  approved:  { bg: 'var(--st-approved-bg)', border: 'var(--st-approved-bd)' },
  requested: { bg: 'var(--st-req-bg)',      border: 'var(--st-req-bd)' },
};

export const STATUS_LABELS = { draft: 'Utkast', pending: 'Väntande', approved: 'Godkänd', requested: 'Begärd' };
export const STATUSES = ['draft', 'pending', 'approved', 'requested'];

export function stToken(status) {
  return status === 'requested' ? 'req' : status;
}

export function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export function indexBlocksByOp(vacationBlocks) {
  const map = {};
  vacationBlocks.forEach(b => { (map[b.operatorId] ??= []).push(b); });
  return map;
}
export const SWEDISH_DAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

export const HOLIDAY_ABBREV = {
  'Annandag påsk': 'Annandag', 'Första maj': 'Första m', 'Första Maj': 'Första m',
  'Kristi himmelsfärdsdag': 'Kristi h', 'Kristi himmelfärdsdag': 'Kristi h',
  'Pingstdagen': 'Pingstda', 'Nationaldagen': 'Sveriges', 'Sveriges nationaldag': 'Sveriges',
  'Midsommarafton': 'Midsom.', 'Midsommardagen': 'Midsom.',
  'Långfredagen': 'Långfre', 'Påskdagen': 'Påskdag',
  'Trettondedag jul': 'Trett.', 'Nyårsdagen': 'Nyår', 'Julafton': 'Julaft',
  'Juldagen': 'Juldag', 'Annandag jul': 'Ann.jul', 'Nyårsafton': 'Nyårsaf',
  'Alla helgons dag': 'Alla h', 'Alla Helgons dag': 'Alla h',
};
