import type { AbsenceStatus } from '@prisma/client';

/** Minimal shapes the engines need — decoupled from Prisma query results. */

export interface EngineOperator {
  id: string;
  shift: string;
  active: boolean;
  /** Process ids the operator is certified for. */
  certifications: string[];
}

export interface EngineProcess {
  id: string;
  name: string;
}

export interface EngineAbsence {
  id: string;
  operatorId: string;
  startWeek: number;
  endWeek: number;
  status: AbsenceStatus;
}

/** demand[processId][week] = required; missing entries fall back to defaultRequired. */
export type DemandMap = Record<string, Record<number, number>>;

export interface EngineSettings {
  minStaffing: number;
  defaultRequired: number;
  allowedOverlap: number;
  lockedWeeks: number[];
}

export type CoverageMode = 'confirmed' | 'projected';

export type CoverageLevel = 'green' | 'yellow' | 'red';

export interface ProcessCoverage {
  process: EngineProcess;
  required: number;
  covered: number;
  level: CoverageLevel;
  operatorsIn: string[];
  operatorsOut: string[];
}

/** processId → coverage for one week. */
export type WeekCoverage = Record<string, ProcessCoverage>;
