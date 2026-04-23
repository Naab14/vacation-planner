import { PROCESSES } from './data';
import { blockCoversWeek } from './dateUtils';

export function getAllCoverageForWeek(operators, vacationBlocks, demand, week, shiftMode, shiftFilter, holidayMap, year) {
  const y = year ?? new Date().getFullYear();
  const coverageMap = {};

  PROCESSES.forEach(proc => {
    coverageMap[proc] = {
      required: demand[proc]?.[week] ?? 2,
      covered: 0,
      operatorsIn: [],
      operatorsOut: [],
      isHoliday: holidayMap?.[week]?.holidays?.length > 0,
    };
  });

  const eligible = operators.filter(op => {
    if (!op.active) return false;
    if (shiftMode === 'separate' && shiftFilter && op.shift !== shiftFilter) return false;
    if (op.certifications.length === 0) return false;
    return true;
  });

  const activeOps = [];
  eligible.forEach(op => {
    const isVacation = vacationBlocks.some(
      vb => vb.operatorId === op.id && vb.status === 'beviljad' && blockCoversWeek(vb, week, y),
    );
    if (isVacation) {
      op.certifications.forEach(cert => {
        if (coverageMap[cert]) coverageMap[cert].operatorsOut.push(op);
      });
    } else {
      activeOps.push(op);
    }
  });

  const multiCerts = [];
  activeOps.forEach(op => {
    if (op.certifications.length === 1) {
      const proc = op.certifications[0];
      if (coverageMap[proc]) {
        coverageMap[proc].covered++;
        coverageMap[proc].operatorsIn.push(op);
      }
    } else {
      multiCerts.push(op);
    }
  });

  multiCerts.forEach(op => {
    let mostNeededProc = null;
    let lowestRatio = Infinity;

    op.certifications.forEach(proc => {
      const covInfo = coverageMap[proc];
      if (covInfo) {
        const ratio = covInfo.required > 0 ? (covInfo.covered / covInfo.required) : Infinity;
        if (ratio < lowestRatio) {
          lowestRatio = ratio;
          mostNeededProc = proc;
        }
      }
    });

    if (mostNeededProc) {
      coverageMap[mostNeededProc].covered++;
      coverageMap[mostNeededProc].operatorsIn.push(op);
    }
  });

  PROCESSES.forEach(proc => {
    const covInfo = coverageMap[proc];
    if (covInfo.covered >= covInfo.required) covInfo.level = 'green';
    else if (covInfo.covered >= covInfo.required - 1) covInfo.level = 'yellow';
    else covInfo.level = 'red';
  });

  return coverageMap;
}

export function getCoverage(operators, vacationBlocks, demand, process, week, shiftMode, shiftFilter, holidayMap, year) {
  const globalCoverage = getAllCoverageForWeek(operators, vacationBlocks, demand, week, shiftMode, shiftFilter, holidayMap, year);
  return globalCoverage[process];
}
