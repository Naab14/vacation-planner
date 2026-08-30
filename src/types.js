/**
 * @typedef {{ id: string, name: string }} Process
 * @typedef {{ initials: string, color: string }} OperatorIcon
 * @typedef {{ id: string, name: string, shift: 'S1' | 'S2', active: boolean, certifications: string[], teamId?: string, icon?: OperatorIcon }} Operator
 * @typedef {{ id: string, operatorId: string, startWeek: number, endWeek: number, status: 'draft' | 'pending' | 'approved' | 'requested', dayStatuses?: { [dateStr: string]: 'draft' | 'pending' | 'approved' | 'requested' }, note?: string }} VacationBlock
 * @typedef {{ [processId: string]: { [week: number]: number } }} Demand
 * @typedef {{ id: string, name: string, shift?: 'S1' | 'S2' }} Team
 * @typedef {{ planningYear: number, shiftMode: 'separate' | 'combined' | 'summer', visibleWeeks: number, startWeek: number, minStaffing: number, allowedOverlap: number, lockedWeeks: number[], holidaysRegion: string, colorCoding?: { greenAt?: number, yellowWithin?: number } }} Settings
 * @typedef {{ schemaVersion: number, operators: Operator[], processes: Process[], vacationBlocks: VacationBlock[], demand: Demand, teams: Team[], settings: Settings }} AppState
 * @typedef {{ process: Process, covered: number, required: number, operatorsIn: Operator[], operatorsOut: Operator[], isHoliday: boolean, level: 'green' | 'yellow' | 'red' }} CoverageResult
 * @typedef {{ holidays: { name: string, dateStr: string, year?: number }[] }} HolidayWeekEntry
 * @typedef {{ [week: number]: HolidayWeekEntry }} HolidayMap
 */

export {};
