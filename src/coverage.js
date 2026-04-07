/**
 * Calculate coverage for a process in a specific week.
 * Returns { covered, required, level, operatorsIn, operatorsOut }
 */
export function getCoverage(operators, vacationBlocks, demand, process, week, shiftMode, shiftFilter, holidayMap) {
  const required = demand[process]?.[week] ?? 2;

  const eligible = operators.filter(op => {
    if (!op.active) return false;
    if (!op.certifications.includes(process)) return false;
    if (shiftMode === 'separate' && shiftFilter && op.shift !== shiftFilter) return false;
    return true;
  });

  const onVacation = eligible.filter(op =>
    vacationBlocks.some(
      vb => vb.operatorId === op.id && vb.status === 'approved' && week >= vb.startWeek && week <= vb.endWeek
    )
  );

  const operatorsIn = eligible.filter(op => !onVacation.find(o => o.id === op.id));
  const operatorsOut = onVacation;
  const covered = operatorsIn.length;

  // Holidays reduce effective coverage expectation display but we still count actual people
  const isHoliday = holidayMap?.[week]?.holidays?.length > 0;

  let level;
  if (covered >= required) level = 'green';
  else if (covered >= required - 1) level = 'yellow';
  else level = 'red';

  return { covered, required, level, operatorsIn, operatorsOut, isHoliday };
}
