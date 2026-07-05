import { db } from '@/lib/db';
import type {
  DemandMap,
  EngineAbsence,
  EngineOperator,
  EngineProcess,
  EngineSettings,
} from '@/server/engine/types';

export interface PlanningData {
  operators: EngineOperator[];
  processes: EngineProcess[];
  absences: EngineAbsence[];
  demand: DemandMap;
  settings: EngineSettings & { planningYear: number; shifts: string[] };
}

/** Load everything the engines need for one org + year in one round trip set. */
export async function loadPlanningData(orgId: string, year: number): Promise<PlanningData> {
  const [settingsRow, operatorRows, processRows, demandRows, absenceRows] = await Promise.all([
    db.settings.findUniqueOrThrow({ where: { orgId } }),
    db.operator.findMany({
      where: { orgId },
      include: { certifications: { select: { processId: true } } },
      orderBy: [{ shift: 'asc' }, { name: 'asc' }],
    }),
    db.process.findMany({ where: { orgId }, orderBy: { sortOrder: 'asc' } }),
    db.demand.findMany({ where: { year, process: { orgId } } }),
    db.absenceBlock.findMany({ where: { year, operator: { orgId } } }),
  ]);

  const demand: DemandMap = {};
  for (const row of demandRows) {
    (demand[row.processId] ??= {})[row.week] = row.required;
  }

  return {
    operators: operatorRows.map((op) => ({
      id: op.id,
      shift: op.shift,
      active: op.active,
      certifications: op.certifications.map((c) => c.processId),
    })),
    processes: processRows.map((p) => ({ id: p.id, name: p.name })),
    absences: absenceRows.map((a) => ({
      id: a.id,
      operatorId: a.operatorId,
      startWeek: a.startWeek,
      endWeek: a.endWeek,
      status: a.status,
    })),
    demand,
    settings: {
      planningYear: settingsRow.planningYear,
      shifts: settingsRow.shifts,
      minStaffing: settingsRow.minStaffing,
      defaultRequired: settingsRow.defaultRequired,
      allowedOverlap: settingsRow.allowedOverlap,
      lockedWeeks: settingsRow.lockedWeeks,
    },
  };
}
