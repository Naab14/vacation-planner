import { db } from '@/lib/db';
import type {
  DemandMap,
  EngineAbsence,
  EngineOperator,
  EngineProcess,
  EngineSettings,
} from '@/server/engine/types';

export interface BoardOperator extends EngineOperator {
  name: string;
  iconColor: string | null;
}

export interface PlanningData {
  operators: BoardOperator[];
  processes: EngineProcess[];
  absences: EngineAbsence[];
  demand: DemandMap;
  holidays: Array<{ week: number; name: string }>;
  settings: EngineSettings & { planningYear: number; shifts: string[]; visibleWeeks: number; startWeek: number };
}

/** Load everything the engines and the board need for one org + year. */
export async function loadPlanningData(orgId: string, year: number): Promise<PlanningData> {
  const settingsRow = await db.settings.findUniqueOrThrow({ where: { orgId } });
  const [operatorRows, processRows, demandRows, absenceRows, holidayRows] = await Promise.all([
    db.operator.findMany({
      where: { orgId },
      include: { certifications: { select: { processId: true } } },
      orderBy: [{ shift: 'asc' }, { name: 'asc' }],
    }),
    db.process.findMany({ where: { orgId }, orderBy: { sortOrder: 'asc' } }),
    db.demand.findMany({ where: { year, process: { orgId } } }),
    db.absenceBlock.findMany({ where: { year, operator: { orgId } } }),
    db.holiday.findMany({
      where: { region: settingsRow.holidaysRegion, year },
      orderBy: { week: 'asc' },
    }),
  ]);

  const demand: DemandMap = {};
  for (const row of demandRows) {
    (demand[row.processId] ??= {})[row.week] = row.required;
  }

  return {
    operators: operatorRows.map((op) => ({
      id: op.id,
      name: op.name,
      iconColor: op.iconColor,
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
    holidays: holidayRows.map((h) => ({ week: h.week, name: h.name })),
    settings: {
      planningYear: settingsRow.planningYear,
      shifts: settingsRow.shifts,
      visibleWeeks: settingsRow.visibleWeeks,
      startWeek: settingsRow.startWeek,
      minStaffing: settingsRow.minStaffing,
      defaultRequired: settingsRow.defaultRequired,
      allowedOverlap: settingsRow.allowedOverlap,
      lockedWeeks: settingsRow.lockedWeeks,
    },
  };
}
