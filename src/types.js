/**
 * @typedef {{ id: string, name: string, shift: 'S1' | 'S2', active: boolean, certifications: string[] }} Operator
 * @typedef {{ id: string, operatorId: string, startDate: string, endDate: string, type: string, status: 'draft' | 'ansökt' | 'beviljad', comment: string }} VacationBlock
 * @typedef {{ id: string, label: string, color: string }} LeaveType
 * @typedef {{ [process: string]: { [week: number]: number } }} Demand
 * @typedef {{ shiftMode: 'separate' | 'combined' | 'summer', visibleWeeks: number, startWeek: number, leaveTypes: LeaveType[] }} Settings
 * @typedef {{ operators: Operator[], vacationBlocks: VacationBlock[], demand: Demand, settings: Settings }} AppState
 * @typedef {{ covered: number, required: number, operatorsIn: Operator[], operatorsOut: Operator[], isHoliday: boolean, level: 'green' | 'yellow' | 'red' }} CoverageResult
 * @typedef {{ holidays: { name: string, dateStr: string, year?: number }[] }} HolidayWeekEntry
 * @typedef {{ [week: number]: HolidayWeekEntry }} HolidayMap
 */

export {};
