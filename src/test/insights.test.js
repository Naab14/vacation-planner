import { describe, it, expect } from 'vitest';
import {
  scanCoverageRisks,
  analyzeSkillCoverage,
  recommendCrossTraining,
  analyzePendingApprovals,
  buildInsights,
  FULL_SEASON,
} from '../insights';
import { PROCESSES, buildDefaultDemand } from '../data';

const makeOp = (id, shift = 'S1', certs = [], active = true) =>
  ({ id, name: `Op ${id}`, shift, active, certifications: certs });
const makeBlock = (id, operatorId, startWeek, endWeek, status = 'draft') =>
  ({ id, operatorId, startWeek, endWeek, status });

/**
 * The coverage model assigns each operator to exactly ONE process per week, so
 * to meet a demand of 2 a process needs 2 distinct certified bodies. `staff`
 * builds single-cert operators per process (2 each by default) which makes the
 * resulting coverage deterministic and easy to reason about. Ids are 1..N in
 * process order; the first Avsyning operator is always id '1'.
 */
function staff(counts = {}) {
  const ops = [];
  let n = 1;
  for (const p of PROCESSES) {
    const c = counts[p] ?? 2;
    for (let i = 0; i < c; i++) ops.push(makeOp(String(n++), 'S1', [p]));
  }
  return ops;
}

function state(overrides = {}) {
  return {
    operators: staff(),
    vacationBlocks: [],
    demand: buildDefaultDemand(),
    settings: { shiftMode: 'combined', visibleWeeks: 12, startWeek: 1 },
    ...overrides,
  };
}

describe('scanCoverageRisks', () => {
  it('reports no risks when every process is fully staffed', () => {
    expect(scanCoverageRisks(state(), { weeks: [10] })).toEqual([]);
  });

  it('flags yellow when a process is one body short', () => {
    const risks = scanCoverageRisks(state({ operators: staff({ Avsyning: 1 }) }), { weeks: [10] });
    expect(risks).toHaveLength(1);
    expect(risks[0]).toMatchObject({ process: 'Avsyning', level: 'yellow', gap: 1, week: 10 });
  });

  it('flags red when nobody covers a process', () => {
    const risks = scanCoverageRisks(state({ operators: staff({ Avsyning: 0 }) }), { weeks: [10] });
    expect(risks).toHaveLength(1);
    expect(risks[0]).toMatchObject({ process: 'Avsyning', level: 'red', gap: 2 });
  });

  it('respects approved vacations within the scanned weeks', () => {
    const risks = scanCoverageRisks(
      state({ vacationBlocks: [makeBlock('b1', '1', 10, 12, 'approved')] }),
      { weeks: [9, 10, 13] },
    );
    expect(risks).toHaveLength(1);
    expect(risks[0]).toMatchObject({ week: 10, process: 'Avsyning', level: 'yellow' });
  });

  it('ignores non-approved vacations', () => {
    const risks = scanCoverageRisks(
      state({ vacationBlocks: [makeBlock('b1', '1', 10, 12, 'pending')] }),
      { weeks: [10] },
    );
    expect(risks).toEqual([]);
  });

  it('can exclude yellow when includeYellow is false', () => {
    const risks = scanCoverageRisks(state({ operators: staff({ Avsyning: 1 }) }), { weeks: [10], includeYellow: false });
    expect(risks).toEqual([]);
  });

  it('sorts red before yellow', () => {
    const risks = scanCoverageRisks(
      state({ operators: staff({ Avsyning: 1, Serialisering: 0 }) }),
      { weeks: [10] },
    );
    expect(risks[0].level).toBe('red');
    expect(risks[risks.length - 1].level).toBe('yellow');
  });

  it('scans the full season by default', () => {
    const risks = scanCoverageRisks(state({ operators: staff({ Avsyning: 0 }) }));
    expect(risks).toHaveLength(FULL_SEASON.length);
  });

  it('separates risks by shift in separate mode', () => {
    const risks = scanCoverageRisks(
      state({ settings: { shiftMode: 'separate', visibleWeeks: 12, startWeek: 1 } }),
      { weeks: [10] },
    );
    // all staff are S1, so every process is red on S2
    expect(risks).toHaveLength(PROCESSES.length);
    expect(risks.every(r => r.shift === 'S2' && r.level === 'red')).toBe(true);
  });
});

describe('analyzeSkillCoverage', () => {
  it('computes depth per process', () => {
    const skills = analyzeSkillCoverage(staff(), 'combined');
    expect(skills).toHaveLength(PROCESSES.length);
    expect(skills.every(s => s.depth === 2 && s.spof === false)).toBe(true);
  });

  it('flags single points of failure (depth <= 1)', () => {
    const skills = analyzeSkillCoverage(staff({ Serialisering: 1, Etikettering: 0 }), 'combined');
    expect(skills.find(s => s.process === 'Serialisering')).toMatchObject({ depth: 1, spof: true });
    expect(skills.find(s => s.process === 'Etikettering')).toMatchObject({ depth: 0, spof: true });
    expect(skills.find(s => s.process === 'Avsyning').spof).toBe(false);
  });

  it('ignores inactive operators in depth', () => {
    const ops = [makeOp('1', 'S1', ['Avsyning'], false)];
    expect(analyzeSkillCoverage(ops, 'combined').find(s => s.process === 'Avsyning').depth).toBe(0);
  });

  it('counts depth per shift group in separate mode', () => {
    const ops = [makeOp('1', 'S1', ['Avsyning']), makeOp('2', 'S2', ['Avsyning'])];
    const avs = analyzeSkillCoverage(ops, 'separate').filter(s => s.process === 'Avsyning');
    expect(avs).toHaveLength(2);
    expect(avs.every(s => s.depth === 1)).toBe(true);
  });

  it('sorts most fragile first', () => {
    const skills = analyzeSkillCoverage(staff({ Avsyning: 1 }), 'combined');
    expect(skills[0].depth).toBeLessThanOrEqual(skills[skills.length - 1].depth);
  });
});

describe('recommendCrossTraining', () => {
  it('returns nothing when there is no risk', () => {
    expect(recommendCrossTraining(state(), { weeks: [10] })).toEqual([]);
  });

  it('suggests training a spare operator who removes risk', () => {
    const ops = [...staff({ Avsyning: 1 }), makeOp('idle', 'S1', [])];
    const recs = recommendCrossTraining(state({ operators: ops }), { weeks: [10] });
    expect(recs.length).toBeGreaterThan(0);
    const idleRec = recs.find(r => r.operatorId === 'idle' && r.process === 'Avsyning');
    expect(idleRec).toBeDefined();
    expect(idleRec.resolvedYellow).toBeGreaterThanOrEqual(1);
  });

  it('never suggests a certification the operator already holds', () => {
    const ops = [...staff({ Avsyning: 1 }), makeOp('idle', 'S1', ['Serialisering'])];
    const recs = recommendCrossTraining(state({ operators: ops }), { weeks: [10] });
    expect(recs.every(r => !(r.operatorId === 'idle' && r.process === 'Serialisering'))).toBe(true);
  });

  it('respects the max limit', () => {
    const ops = [makeOp('a', 'S1', []), makeOp('b', 'S1', []), makeOp('c', 'S1', [])];
    const recs = recommendCrossTraining(state({ operators: ops }), { weeks: [10], max: 2 });
    expect(recs.length).toBeLessThanOrEqual(2);
  });
});

describe('analyzePendingApprovals', () => {
  it('marks an approval safe when coverage stays healthy', () => {
    const s = state({
      operators: staff({ Avsyning: 3 }),
      vacationBlocks: [makeBlock('b1', '1', 10, 11, 'pending')],
    });
    const [res] = analyzePendingApprovals(s);
    expect(res.verdict).toBe('safe');
    expect(res.conflicts).toEqual([]);
  });

  it('marks an approval as caution when it creates a yellow', () => {
    const s = state({ vacationBlocks: [makeBlock('b1', '1', 10, 10, 'pending')] });
    const [res] = analyzePendingApprovals(s);
    expect(res.verdict).toBe('caution');
    expect(res.conflicts.length).toBeGreaterThan(0);
    expect(res.conflicts.every(c => c.to === 'yellow')).toBe(true);
  });

  it('marks an approval risky when it pushes a process to red', () => {
    const s = state({
      operators: staff({ Avsyning: 1 }),
      vacationBlocks: [makeBlock('b1', '1', 10, 10, 'pending')],
    });
    const [res] = analyzePendingApprovals(s);
    expect(res.verdict).toBe('risky');
    expect(res.conflicts.some(c => c.to === 'red')).toBe(true);
  });

  it('only considers non-approved blocks', () => {
    const s = state({ vacationBlocks: [makeBlock('b1', '1', 10, 10, 'approved')] });
    expect(analyzePendingApprovals(s)).toEqual([]);
  });

  it('only inspects processes the operator is certified for', () => {
    const s = state({
      operators: staff({ Avsyning: 2, Serialisering: 1 }),
      vacationBlocks: [makeBlock('b1', '1', 10, 10, 'pending')],
    });
    const [res] = analyzePendingApprovals(s);
    expect(res.conflicts.every(c => c.process === 'Avsyning')).toBe(true);
  });
});

describe('buildInsights', () => {
  it('assembles a complete summary', () => {
    const s = state({
      operators: [...staff({ Avsyning: 1 }), makeOp('idle', 'S1', [])],
      vacationBlocks: [makeBlock('b1', '1', 10, 10, 'pending')],
    });
    const ins = buildInsights(s, { weeks: [10] });
    expect(ins).toHaveProperty('risks');
    expect(ins).toHaveProperty('redWeeks');
    expect(ins).toHaveProperty('yellowWeeks');
    expect(ins).toHaveProperty('spofs');
    expect(ins).toHaveProperty('crossTraining');
    expect(ins).toHaveProperty('approvals');
    expect(ins.safeApprovals + ins.riskyApprovals).toBe(ins.approvals.length);
  });
});
