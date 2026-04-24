import { getISOWeekMonday, getISOWeekFriday } from './dateUtils';

const STATUS_MAP = {
  draft: 'draft',
  pending: 'ansökt',
  requested: 'ansökt',
  approved: 'beviljad',
};

export const defaultLeaveTypes = [
  { id: 'semester', label: 'Semester', color: '#22c55e' },
  { id: 'vab', label: 'VAB', color: '#3b82f6' },
  { id: 'sjuk', label: 'Sjukdag', color: '#f43f5e' },
  { id: 'komp', label: 'Kompledigt', color: '#a855f7' },
];

function migrateBlock(block, year) {
  if (block.startDate) return block;
  return {
    id: block.id,
    operatorId: block.operatorId,
    startDate: getISOWeekMonday(year, block.startWeek),
    endDate: getISOWeekFriday(year, block.endWeek),
    type: block.type || 'semester',
    status: STATUS_MAP[block.status] || 'draft',
    comment: block.comment || '',
  };
}

export function migrateState(state) {
  if (!state) return state;

  const year = new Date().getFullYear();
  const needsBlockMigration = state.vacationBlocks?.some(b => b.startWeek != null);
  const needsLeaveTypes = !state.settings?.leaveTypes;

  if (!needsBlockMigration && !needsLeaveTypes) return state;

  const migrated = { ...state };

  if (needsBlockMigration) {
    migrated.vacationBlocks = state.vacationBlocks.map(b => migrateBlock(b, year));
  }

  if (needsLeaveTypes) {
    migrated.settings = {
      ...migrated.settings,
      leaveTypes: defaultLeaveTypes,
    };
  }

  return migrated;
}
