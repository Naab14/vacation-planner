import { PROCESSES } from './data';
import { getAllCoverageForWeek } from './coverage';

/**
 * Planning Assistant engine.
 *
 * The calendar grid is *descriptive* — it shows coverage once vacations are
 * placed. This module is *prescriptive*: it scans the whole planning horizon
 * and answers the questions a real shift planner actually has:
 *
 *   • Where is coverage at risk, and how badly?               (scanCoverageRisks)
 *   • Which processes are a single point of failure?          (analyzeSkillCoverage)
 *   • Who should I cross-train to remove the most risk?       (recommendCrossTraining)
 *   • Is it safe to approve this vacation request?            (analyzePendingApprovals)
 *
 * Everything here is a pure function over AppState so it is trivially testable
 * and reuses the exact same coverage model the grid renders from.
 */

export const FULL_SEASON = Array.from({ length: 52 }, (_, i) => i + 1);

const LEVEL_RANK = { red: 2, yellow: 1, green: 0 };

/** Mirror the shift grouping CalendarGrid renders so insights match the grid. */
function groupsFor(shiftMode) {
  return shiftMode === 'separate'
    ? [{ label: 'S1', shift: 'S1' }, { label: 'S2', shift: 'S2' }]
    : [{ label: shiftMode === 'summer' ? 'Summer' : 'All', shift: null }];
}

function withCert(operators, opId, process) {
  return operators.map(o =>
    o.id === opId ? { ...o, certifications: [...o.certifications, process] } : o,
  );
}

function withApproved(vacationBlocks, blockId) {
  return vacationBlocks.map(b => (b.id === blockId ? { ...b, status: 'approved' } : b));
}

/**
 * Scan every (shift × week × process) cell across the horizon and collect the
 * ones that are not fully covered. Sorted worst-first (red → yellow, bigger gap,
 * earlier week) so the UI can show the most urgent problems at the top.
 */
export function scanCoverageRisks(state, { weeks = FULL_SEASON, holidayMap = {}, includeYellow = true } = {}) {
  const { operators, vacationBlocks, demand, settings } = state;
  const groups = groupsFor(settings.shiftMode);
  const risks = [];

  for (const g of groups) {
    for (const wk of weeks) {
      const cov = getAllCoverageForWeek(operators, vacationBlocks, demand, wk, settings.shiftMode, g.shift, holidayMap);
      for (const proc of PROCESSES) {
        const c = cov[proc];
        if (!c) continue;
        if (c.level === 'red' || (includeYellow && c.level === 'yellow')) {
          risks.push({
            week: wk,
            process: proc,
            shift: g.shift,
            groupLabel: g.label,
            level: c.level,
            covered: c.covered,
            required: c.required,
            gap: Math.max(0, c.required - c.covered),
            isHoliday: c.isHoliday,
          });
        }
      }
    }
  }

  risks.sort((a, b) =>
    LEVEL_RANK[b.level] - LEVEL_RANK[a.level] ||
    b.gap - a.gap ||
    a.week - b.week,
  );
  return risks;
}

function countLevels(risks) {
  let red = 0, yellow = 0;
  for (const r of risks) {
    if (r.level === 'red') red++;
    else if (r.level === 'yellow') yellow++;
  }
  return { red, yellow };
}

/**
 * Structural skill depth (a binary skills matrix rolled up per process).
 * "Depth" = number of active operators certified for a process in that shift
 * group. A depth of 0 or 1 is a single point of failure: one absence (or one
 * resignation) takes the process below the line.
 */
export function analyzeSkillCoverage(operators, shiftMode) {
  const groups = groupsFor(shiftMode);
  const result = [];
  for (const g of groups) {
    for (const proc of PROCESSES) {
      const certified = operators.filter(o =>
        o.active &&
        o.certifications.includes(proc) &&
        (g.shift ? o.shift === g.shift : true),
      );
      result.push({
        process: proc,
        shift: g.shift,
        groupLabel: g.label,
        depth: certified.length,
        operators: certified,
        spof: certified.length <= 1,
      });
    }
  }
  // Most fragile first.
  result.sort((a, b) => a.depth - b.depth);
  return result;
}

/**
 * Greedy single-step cross-training recommendations. For every (active
 * operator, process they are NOT yet certified in) pair, simulate granting the
 * certification and measure how many red / yellow risk-weeks it removes. Return
 * the highest-impact suggestions.
 */
export function recommendCrossTraining(state, { weeks = FULL_SEASON, holidayMap = {}, max = 6 } = {}) {
  const baseline = countLevels(scanCoverageRisks(state, { weeks, holidayMap }));
  if (baseline.red === 0 && baseline.yellow === 0) return [];

  const suggestions = [];
  for (const op of state.operators) {
    if (!op.active) continue;
    for (const proc of PROCESSES) {
      if (op.certifications.includes(proc)) continue;
      const simState = { ...state, operators: withCert(state.operators, op.id, proc) };
      const after = countLevels(scanCoverageRisks(simState, { weeks, holidayMap }));
      const resolvedRed = baseline.red - after.red;
      const resolvedYellow = baseline.yellow - after.yellow;
      if (resolvedRed > 0 || resolvedYellow > 0) {
        suggestions.push({
          operatorId: op.id,
          operatorName: op.name,
          shift: op.shift,
          process: proc,
          resolvedRed,
          resolvedYellow,
        });
      }
    }
  }

  suggestions.sort((a, b) =>
    b.resolvedRed - a.resolvedRed ||
    b.resolvedYellow - a.resolvedYellow ||
    a.operatorName.localeCompare(b.operatorName),
  );
  return suggestions.slice(0, max);
}

/**
 * For every vacation request that is not yet approved, decide whether approving
 * it is safe. We only look at the processes the operator is certified for (the
 * only ones their absence can affect) across the weeks the block spans, and
 * report any cell that would degrade (green→yellow, or anything→red).
 *
 *   verdict: 'safe'    — approving changes no coverage level for the worse
 *            'caution' — would create a yellow (one short) somewhere
 *            'risky'   — would push a process into red (understaffed)
 */
export function analyzePendingApprovals(state, { holidayMap = {} } = {}) {
  const { operators, vacationBlocks, demand, settings } = state;
  const candidates = vacationBlocks.filter(b => b.status !== 'approved');

  return candidates.map(block => {
    const op = operators.find(o => o.id === block.operatorId);
    const shiftFilter = settings.shiftMode === 'separate' ? (op?.shift ?? null) : null;
    const simBlocks = withApproved(vacationBlocks, block.id);
    const affectedProcesses = op?.certifications?.length ? op.certifications : PROCESSES;
    const conflicts = [];

    for (let wk = block.startWeek; wk <= block.endWeek; wk++) {
      const before = getAllCoverageForWeek(operators, vacationBlocks, demand, wk, settings.shiftMode, shiftFilter, holidayMap);
      const after = getAllCoverageForWeek(operators, simBlocks, demand, wk, settings.shiftMode, shiftFilter, holidayMap);
      for (const proc of affectedProcesses) {
        const b = before[proc];
        const a = after[proc];
        if (!a || !b) continue;
        const degraded = LEVEL_RANK[a.level] > LEVEL_RANK[b.level];
        if (degraded) {
          conflicts.push({
            week: wk,
            process: proc,
            from: b.level,
            to: a.level,
            covered: a.covered,
            required: a.required,
          });
        }
      }
    }

    const hasRed = conflicts.some(c => c.to === 'red');
    const verdict = hasRed ? 'risky' : conflicts.length ? 'caution' : 'safe';
    return { block, operator: op, verdict, conflicts };
  });
}

/**
 * One call that assembles the full picture for the Planning Assistant panel.
 */
export function buildInsights(state, { weeks = FULL_SEASON, holidayMap = {} } = {}) {
  const risks = scanCoverageRisks(state, { weeks, holidayMap });
  const { red, yellow } = countLevels(risks);
  const skills = analyzeSkillCoverage(state.operators, state.settings.shiftMode);
  const approvals = analyzePendingApprovals(state, { holidayMap });

  return {
    risks,
    redWeeks: red,
    yellowWeeks: yellow,
    skills,
    spofs: skills.filter(s => s.spof),
    crossTraining: recommendCrossTraining(state, { weeks, holidayMap }),
    approvals,
    safeApprovals: approvals.filter(a => a.verdict === 'safe').length,
    riskyApprovals: approvals.filter(a => a.verdict !== 'safe').length,
  };
}
