import {
  defaultProcesses,
  seedOperators,
  seedVacationBlocks,
  defaultSettings,
  buildDefaultDemand,
  buildDefaultState,
} from './schema';

export {
  defaultProcesses,
  seedOperators,
  seedVacationBlocks,
  defaultSettings,
  buildDefaultDemand,
  buildDefaultState,
};

// Backward-compatible name list for older tests/import paths while components migrate to process records.
export const PROCESSES = defaultProcesses.map(process => process.name);

export const themes = [
  { id: 'default', label: 'Default' },
  { id: 'motherduck', label: 'MotherDuck' },
  { id: 'dark', label: 'Dark' },
  { id: 'ocean', label: 'Ocean' },
];
