import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthorizationError, requireUser } from '@/lib/rbac';
import { loadPlanningData } from '@/server/data/planning';
import { computeWeekCoverage } from '@/server/engine/coverage';

const querySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  from: z.coerce.number().int().min(1).max(53),
  to: z.coerce.number().int().min(1).max(53),
  mode: z.enum(['confirmed', 'projected']).default('confirmed'),
  shift: z.string().min(1).max(10).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireUser();
    const url = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query', issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const { year, from, to, mode, shift } = parsed.data;
    if (from > to) {
      return NextResponse.json({ error: '`from` must be ≤ `to`' }, { status: 400 });
    }

    const data = await loadPlanningData(session.user.orgId, year);
    const shifts = shift ? [shift] : data.settings.shifts;

    const weeks = [] as Array<{
      week: number;
      shifts: Record<string, ReturnType<typeof computeWeekCoverage>>;
    }>;
    for (let week = from; week <= to; week++) {
      const perShift: Record<string, ReturnType<typeof computeWeekCoverage>> = {};
      for (const s of shifts) {
        perShift[s] = computeWeekCoverage({
          operators: data.operators,
          absences: data.absences,
          processes: data.processes,
          demand: data.demand,
          week,
          shift: s,
          mode,
          settings: data.settings,
        });
      }
      weeks.push({ week, shifts: perShift });
    }

    return NextResponse.json({ year, mode, weeks });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
