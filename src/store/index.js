/**
 * Persistence store — the single seam between the app and where data lives.
 *
 * Today it is backed by localStorage (via src/storage.js), but the interface is
 * intentionally async (get/save return Promises) so it can be swapped for a REST
 * or Supabase backend later WITHOUT touching any component. Components and App
 * talk to this module, never to localStorage directly, for core workspace state.
 */
import { saveState as lsSave, loadState as lsLoad, clearState as lsClear } from '../storage';
import { seedProcesses, buildDefaultDemand, defaultSettings, SCHEMA_VERSION } from '../data';

/**
 * Bring any previously-saved state up to the current schema. Pure function —
 * given an old blob, return a valid current-shape blob. Safe to run on every
 * load (idempotent).
 */
export function migrateState(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const state = { ...raw };

  // v1 → v2: processes became stateful; settings gained planning/staffing fields.
  if (!Array.isArray(state.processes) || state.processes.length === 0) {
    // Recover the process list from existing demand keys, else fall back to seed.
    const fromDemand = state.demand ? Object.keys(state.demand) : [];
    state.processes = fromDemand.length ? fromDemand : [...seedProcesses];
  }

  state.settings = { ...defaultSettings, ...(state.settings || {}) };

  // Guarantee every process has a demand column (52 weeks) so coverage never
  // reads undefined for a process added by an older/newer build.
  const demand = { ...(state.demand || {}) };
  for (const proc of state.processes) {
    if (!demand[proc]) {
      demand[proc] = {};
      for (let w = 1; w <= 52; w++) demand[proc][w] = state.settings.defaultRequired ?? 2;
    }
  }
  state.demand = demand;

  state.operators = (state.operators || []).map(op => ({
    active: true,
    certifications: [],
    ...op,
  }));
  state.vacationBlocks = state.vacationBlocks || [];
  state.schemaVersion = SCHEMA_VERSION;
  return state;
}

/** Build a clean default workspace. */
export function freshState() {
  const processes = [...seedProcesses];
  return {
    schemaVersion: SCHEMA_VERSION,
    processes,
    operators: [],
    vacationBlocks: [],
    demand: buildDefaultDemand(processes, defaultSettings.defaultRequired),
    settings: { ...defaultSettings },
  };
}

/**
 * The store interface. localStorageStore is the default implementation; a future
 * apiStore({ baseUrl }) could implement the same three methods against a server.
 */
export function localStorageStore() {
  return {
    async load() {
      const raw = lsLoad();
      return raw ? migrateState(raw) : null;
    },
    async save(state) {
      lsSave(state);
    },
    async clear() {
      lsClear();
    },
  };
}

export const store = localStorageStore();
