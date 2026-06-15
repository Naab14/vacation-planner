import { getAllCoverageForWeek } from './coverage';

export function buildDashboardSummary({
  operators,
  vacationBlocks,
  demand,
  processes,
  weeks,
  settings,
  holidayMap,
}) {
  const operatorById = new Map(operators.map(op => [op.id, op]));
  const pendingCount = vacationBlocks.filter(block => block.status === 'pending' || block.status === 'requested').length;
  const redWeeks = [];
  const biggestGaps = [];

  weeks.forEach(week => {
    const coverage = getAllCoverageForWeek(
      operators,
      vacationBlocks,
      demand,
      week,
      settings.shiftMode,
      null,
      holidayMap,
      processes,
      'projected',
    );
    let hasRed = false;
    processes.forEach(process => {
      const cov = coverage[process.id];
      if (!cov) return;
      if (cov.level === 'red') hasRed = true;
      const gap = Math.max(0, cov.required - cov.covered);
      if (gap > 0) biggestGaps.push({ week, processId: process.id, processName: process.name, gap });
    });
    if (hasRed) redWeeks.push(week);
  });

  const currentWeek = weeks[0];
  const nextWeek = weeks[1];
  const offForWeek = week => vacationBlocks
    .filter(block =>
      ['approved', 'pending', 'requested'].includes(block.status) &&
      week >= block.startWeek &&
      week <= block.endWeek
    )
    .map(block => operatorById.get(block.operatorId))
    .filter(Boolean);

  return {
    pendingCount,
    redWeeks,
    offThisWeek: offForWeek(currentWeek),
    offNextWeek: nextWeek ? offForWeek(nextWeek) : [],
    biggestGaps: biggestGaps.sort((a, b) => b.gap - a.gap || a.week - b.week).slice(0, 6),
  };
}
