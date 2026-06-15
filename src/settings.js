function clampInteger(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(parsed)));
}

export function sanitizeSettingsPatch(current = {}, patch = {}) {
  const visibleWeeks = clampInteger(
    patch.visibleWeeks ?? current.visibleWeeks,
    4,
    52,
    current.visibleWeeks ?? 12,
  );
  const startWeekMax = Math.max(1, 52 - visibleWeeks + 1);

  return {
    ...current,
    ...patch,
    planningYear: clampInteger(patch.planningYear ?? current.planningYear, 2020, 2100, current.planningYear ?? 2026),
    visibleWeeks,
    startWeek: clampInteger(patch.startWeek ?? current.startWeek, 1, startWeekMax, current.startWeek ?? 1),
    minStaffing: clampInteger(patch.minStaffing ?? current.minStaffing, 0, 20, current.minStaffing ?? 0),
    allowedOverlap: clampInteger(patch.allowedOverlap ?? current.allowedOverlap, 0, 20, current.allowedOverlap ?? 0),
    lockedWeeks: Array.isArray(patch.lockedWeeks)
      ? Array.from(new Set(patch.lockedWeeks.filter(week => Number.isInteger(week) && week >= 1 && week <= 53))).sort((a, b) => a - b)
      : (current.lockedWeeks || []),
  };
}
