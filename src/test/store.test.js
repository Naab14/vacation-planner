import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStore } from '../store';
import { SCHEMA_VERSION } from '../schema';

const mockStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn(key => { delete store[key]; }),
    clear: () => { store = {}; },
    raw: () => store,
  };
})();

beforeEach(() => {
  mockStorage.clear();
  mockStorage.getItem.mockClear();
  mockStorage.setItem.mockClear();
  mockStorage.removeItem.mockClear();
  vi.stubGlobal('localStorage', mockStorage);
});

describe('local store abstraction', () => {
  it('migrates legacy state when reading through the async store API', async () => {
    mockStorage.setItem('state', JSON.stringify({
      operators: [{ id: '1', name: 'Anna', shift: 'S1', active: true, certifications: ['Avsyning'] }],
      vacationBlocks: [],
      demand: { Avsyning: { 15: 3 } },
      settings: { shiftMode: 'combined', visibleWeeks: 12, startWeek: 15 },
    }));
    const store = createLocalStore({ stateKey: 'state' });

    const loaded = await store.getState();

    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
    expect(loaded.operators[0].certifications).toEqual(['avsyning']);
    expect(loaded.demand.avsyning[15]).toBe(3);
  });

  it('saves migrated state through the async store API', async () => {
    const store = createLocalStore({ stateKey: 'state' });

    await store.saveState({
      operators: [{ id: '1', name: 'Anna', shift: 'S1', active: true, certifications: ['Avsyning'] }],
      vacationBlocks: [],
      demand: { Avsyning: { 15: 3 } },
      settings: { shiftMode: 'combined', visibleWeeks: 12, startWeek: 15 },
    });

    const raw = JSON.parse(mockStorage.raw().state);
    expect(raw.schemaVersion).toBe(SCHEMA_VERSION);
    expect(raw.operators[0].certifications).toEqual(['avsyning']);
  });

  it('exposes sync methods for the current client-only storage facade', () => {
    const store = createLocalStore({ themeKey: 'theme', uiKey: 'ui' });

    store.saveThemeSync('dark');
    store.saveUISync({ zoom: 'day' });

    expect(store.getThemeSync()).toBe('dark');
    expect(store.getUISync()).toEqual({ zoom: 'day' });
  });
});
