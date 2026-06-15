import { defaultProcesses } from './schema';

const VACATION_STATUSES_BY_MODE = {
  confirmed: new Set(['approved']),
  projected: new Set(['approved', 'pending', 'requested']),
};

function buildLookup(processes) {
  const lookup = new Map();
  processes.forEach(process => {
    lookup.set(process.id.toLowerCase(), process.id);
    lookup.set(process.name.toLowerCase(), process.id);
  });
  return lookup;
}

function resolveProcessId(processOrName, lookup) {
  if (!processOrName) return null;
  return lookup.get(String(processOrName).toLowerCase()) || processOrName;
}

function normalizeCertifications(certifications, lookup) {
  return Array.from(new Set((certifications || [])
    .map(cert => resolveProcessId(cert, lookup))
    .filter(Boolean)));
}

/**
 * Calculate weekly coverage across all processes intelligently.
 * Operators with one cert get assigned first.
 * Multi-certified operators get assigned dynamically to the process with the highest need.
 */
export function getAllCoverageForWeek(
  operators,
  vacationBlocks,
  demand,
  week,
  shiftMode,
  shiftFilter,
  holidayMap,
  processes = defaultProcesses,
  coverageMode = 'confirmed',
) {
  const processList = processes && processes.length ? processes : defaultProcesses;
  const lookup = buildLookup(processList);
  const coverageMap = {};

  processList.forEach(process => {
    coverageMap[process.id] = {
      process,
      required: demand[process.id]?.[week] ?? demand[process.name]?.[week] ?? 2,
      covered: 0,
      operatorsIn: [],
      operatorsOut: [],
      isHoliday: holidayMap?.[week]?.holidays?.length > 0,
    };
  });

  const eligible = operators.filter(op => {
    if (!op.active) return false;
    if (shiftMode === 'separate' && shiftFilter && op.shift !== shiftFilter) return false;
    if (normalizeCertifications(op.certifications, lookup).length === 0) return false;
    return true;
  });

  const vacationStatuses = VACATION_STATUSES_BY_MODE[coverageMode] || VACATION_STATUSES_BY_MODE.confirmed;
  const activeOps = [];
  eligible.forEach(op => {
    const certs = normalizeCertifications(op.certifications, lookup);
    const isVacation = vacationBlocks.some(vb =>
      vb.operatorId === op.id &&
      vacationStatuses.has(vb.status) &&
      week >= vb.startWeek &&
      week <= vb.endWeek
    );
    if (isVacation) {
      certs.forEach(cert => {
        if (coverageMap[cert]) coverageMap[cert].operatorsOut.push(op);
      });
    } else {
      activeOps.push({ ...op, certifications: certs });
    }
  });

  const multiCerts = [];
  activeOps.forEach(op => {
    if (op.certifications.length === 1) {
      const processId = op.certifications[0];
      if (coverageMap[processId]) {
        coverageMap[processId].covered++;
        coverageMap[processId].operatorsIn.push(op);
      }
    } else {
      multiCerts.push(op);
    }
  });

  multiCerts.forEach(op => {
    let mostNeededProcess = null;
    let lowestRatio = Infinity;

    op.certifications.forEach(processId => {
      const coverage = coverageMap[processId];
      if (!coverage) return;
      const ratio = coverage.required > 0 ? (coverage.covered / coverage.required) : Infinity;
      if (ratio < lowestRatio) {
        lowestRatio = ratio;
        mostNeededProcess = processId;
      }
    });

    if (mostNeededProcess) {
      coverageMap[mostNeededProcess].covered++;
      coverageMap[mostNeededProcess].operatorsIn.push(op);
    }
  });

  processList.forEach(process => {
    const coverage = coverageMap[process.id];
    if (coverage.covered >= coverage.required) coverage.level = 'green';
    else if (coverage.covered >= coverage.required - 1) coverage.level = 'yellow';
    else coverage.level = 'red';
  });

  return coverageMap;
}

/**
 * Fallback backward compatibility for individual cell lookups.
 */
export function getCoverage(
  operators,
  vacationBlocks,
  demand,
  process,
  week,
  shiftMode,
  shiftFilter,
  holidayMap,
  processes = defaultProcesses,
  coverageMode = 'confirmed',
) {
  const processList = processes && processes.length ? processes : defaultProcesses;
  const lookup = buildLookup(processList);
  const processId = resolveProcessId(process, lookup);
  const globalCoverage = getAllCoverageForWeek(
    operators,
    vacationBlocks,
    demand,
    week,
    shiftMode,
    shiftFilter,
    holidayMap,
    processList,
    coverageMode,
  );
  return globalCoverage[processId];
}
