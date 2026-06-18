import { getAllCoverageForWeek } from './coverage';
import { defaultSettings } from './schema';

const PROJECTED_STATUSES = new Set(['approved', 'pending', 'requested']);

export function weeksInRange(startWeek, endWeek) {
  const start = Math.min(startWeek, endWeek);
  const end = Math.max(startWeek, endWeek);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function isRangeLocked(startWeek, endWeek, lockedWeeks = []) {
  const locked = new Set(lockedWeeks || []);
  return weeksInRange(startWeek, endWeek).some(week => locked.has(week));
}

function getShiftLabel(settings, operators = [], candidate) {
  if (settings.shiftMode !== 'separate') return null;
  return operators.find(operator => operator.id === candidate.operatorId)?.shift || null;
}

function isSameShift(block, shiftFilter, operators = []) {
  if (!shiftFilter) return true;
  return operators.find(operator => operator.id === block.operatorId)?.shift === shiftFilter;
}

export function getOverlapWarnings(vacationBlocks, candidate, settings = {}, context = {}) {
  const allowedOverlap = Number(settings.allowedOverlap ?? defaultSettings.allowedOverlap);
  const shiftFilter = getShiftLabel(settings, context.operators, candidate);
  const warnings = [];
  weeksInRange(candidate.startWeek, candidate.endWeek).forEach(week => {
    const absent = vacationBlocks.filter(block =>
      block.id !== candidate.id &&
      PROJECTED_STATUSES.has(block.status) &&
      isSameShift(block, shiftFilter, context.operators) &&
      week >= block.startWeek &&
      week <= block.endWeek
    ).length + 1;
    if (absent > allowedOverlap) warnings.push(`v.${week} exceeds allowed overlap (${allowedOverlap})`);
  });
  return warnings;
}

function getCandidateBlocks(vacationBlocks, candidate) {
  const existing = vacationBlocks.find(block => block.id === candidate.id);
  const candidateBlock = {
    ...existing,
    ...candidate,
    status: candidate.status ?? existing?.status ?? 'requested',
  };
  return [
    ...vacationBlocks.filter(block => block.id !== candidate.id),
    candidateBlock,
  ];
}

function isOperatorOut(operatorId, vacationBlocks, week) {
  return vacationBlocks.some(block =>
    block.operatorId === operatorId &&
    PROJECTED_STATUSES.has(block.status) &&
    week >= block.startWeek &&
    week <= block.endWeek
  );
}

export function getCapacityWarnings(vacationBlocks, candidate, settings = {}, context = {}) {
  const { operators, demand, processes, holidayMap } = context;
  if (!operators?.length || !processes?.length || !demand) return [];

  const candidateBlocks = getCandidateBlocks(vacationBlocks, candidate);
  const shiftFilter = getShiftLabel(settings, operators, candidate);
  const warnings = [];

  weeksInRange(candidate.startWeek, candidate.endWeek).forEach(week => {
    const minStaffing = Number(settings.minStaffing ?? defaultSettings.minStaffing);
    if (minStaffing > 0) {
      const beforeStaff = operators.filter(operator => {
        if (!operator.active) return false;
        if (shiftFilter && operator.shift !== shiftFilter) return false;
        return !isOperatorOut(operator.id, vacationBlocks, week);
      }).length;
      const availableStaff = operators.filter(operator => {
        if (!operator.active) return false;
        if (shiftFilter && operator.shift !== shiftFilter) return false;
        return !isOperatorOut(operator.id, candidateBlocks, week);
      }).length;
      if (availableStaff < minStaffing && availableStaff < beforeStaff) {
        warnings.push(`v.${week} ${shiftFilter || 'All operators'} below minimum staffing (${availableStaff}/${minStaffing})`);
      }
    }

    const beforeCoverage = getAllCoverageForWeek(
      operators,
      vacationBlocks,
      demand,
      week,
      settings.shiftMode,
      shiftFilter,
      holidayMap,
      processes,
      'projected',
      settings,
    );
    const coverage = getAllCoverageForWeek(
      operators,
      candidateBlocks,
      demand,
      week,
      settings.shiftMode,
      shiftFilter,
      holidayMap,
      processes,
      'projected',
      settings,
    );
    Object.values(coverage).forEach(item => {
      const before = beforeCoverage[item.process.id];
      if (item.level === 'red' && (!before || before.level !== 'red' || item.covered < before.covered)) {
        warnings.push(`v.${week} ${item.process.name} would drop to RED`);
      }
    });
  });

  return Array.from(new Set(warnings));
}

export function buildConflictSummary(vacationBlocks, candidate, settings = {}, context = {}) {
  const messages = [];
  const locked = isRangeLocked(candidate.startWeek, candidate.endWeek, settings.lockedWeeks);
  if (locked) messages.push('Week locked');
  messages.push(...getOverlapWarnings(vacationBlocks, candidate, settings, context));
  messages.push(...getCapacityWarnings(vacationBlocks, candidate, settings, context));
  return {
    blocked: locked,
    messages,
    level: locked ? 'error' : messages.length ? 'warning' : 'ok',
  };
}
