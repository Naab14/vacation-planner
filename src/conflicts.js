export function weeksInRange(startWeek, endWeek) {
  const start = Math.min(startWeek, endWeek);
  const end = Math.max(startWeek, endWeek);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function isRangeLocked(startWeek, endWeek, lockedWeeks = []) {
  const locked = new Set(lockedWeeks || []);
  return weeksInRange(startWeek, endWeek).some(week => locked.has(week));
}

export function getOverlapWarnings(vacationBlocks, candidate, settings = {}) {
  const allowedOverlap = Number(settings.allowedOverlap ?? 2);
  const warnings = [];
  weeksInRange(candidate.startWeek, candidate.endWeek).forEach(week => {
    const absent = vacationBlocks.filter(block =>
      block.id !== candidate.id &&
      week >= block.startWeek &&
      week <= block.endWeek
    ).length + 1;
    if (absent > allowedOverlap) warnings.push(`v.${week} exceeds allowed overlap (${allowedOverlap})`);
  });
  return warnings;
}

export function buildConflictSummary(vacationBlocks, candidate, settings = {}) {
  const messages = [];
  const locked = isRangeLocked(candidate.startWeek, candidate.endWeek, settings.lockedWeeks);
  if (locked) messages.push('Week locked');
  messages.push(...getOverlapWarnings(vacationBlocks, candidate, settings));
  return {
    blocked: locked,
    messages,
    level: locked ? 'error' : messages.length ? 'warning' : 'ok',
  };
}
