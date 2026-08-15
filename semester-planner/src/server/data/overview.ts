import { db } from '@/lib/db';
import { computeWeekCoverage } from '@/server/engine/coverage';
import type { CoverageLevel, CoverageMode } from '@/server/engine/types';
import { loadPlanningData, type PlanningData } from '@/server/data/planning';

export interface CoverageCell {
  week: number;
  shift: string;
  processId: string;
  processName: string;
  required: number;
  covered: number;
  level: CoverageLevel;
}

export interface CoverageScan {
  data: PlanningData;
  weeks: number[];
  /** One cell per week × shift × process. */
  cells: CoverageCell[];
}

/** Run the coverage engine across the whole visible planning window. */
export async function scanCoverage(orgId: string, mode: CoverageMode): Promise<CoverageScan> {
  const { planningYear } = await db.settings.findUniqueOrThrow({ where: { orgId } });
  const data = await loadPlanningData(orgId, planningYear);
  const { settings, operators, absences, processes, demand } = data;

  const weeks = Array.from({ length: settings.visibleWeeks }, (_, i) => settings.startWeek + i).filter(
    (w) => w >= 1 && w <= 53,
  );

  const cells: CoverageCell[] = [];
  for (const week of weeks) {
    for (const shift of settings.shifts) {
      const coverage = computeWeekCoverage({
        operators,
        absences,
        processes,
        demand,
        week,
        shift,
        mode,
        settings,
      });
      for (const slot of Object.values(coverage)) {
        cells.push({
          week,
          shift,
          processId: slot.process.id,
          processName: slot.process.name,
          required: slot.required,
          covered: slot.covered,
          level: slot.level,
        });
      }
    }
  }

  return { data, weeks, cells };
}
