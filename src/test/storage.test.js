import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveState, loadState, clearState, saveTheme, loadTheme, saveUI, loadUI, buildShareLink, copyToClipboard } from '../storage';
import { SCHEMA_VERSION } from '../schema';

const mockStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] ?? null),
    setItem: vi.fn((key, val) => { store[key] = val; }),
    removeItem: vi.fn(key => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();

beforeEach(() => {
  mockStorage.clear();
  mockStorage.getItem.mockClear();
  mockStorage.setItem.mockClear();
  mockStorage.removeItem.mockClear();
  vi.stubGlobal('localStorage', mockStorage);
});

describe('state persistence', () => {
  const testState = { operators: [{ id: '1', name: 'Test' }], vacationBlocks: [], demand: {}, settings: { shiftMode: 'separate', visibleWeeks: 12, startWeek: 15 } };

  it('saveState + loadState roundtrip', () => {
    saveState(testState);
    const loaded = loadState();
    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
    expect(loaded.operators[0].name).toBe('Test');
  });

  it('loadState migrates legacy process-name state', () => {
    saveState({
      operators: [{ id: '1', name: 'Anna', shift: 'S1', active: true, certifications: ['Avsyning'] }],
      vacationBlocks: [],
      demand: { Avsyning: { 15: 4 } },
      settings: { shiftMode: 'combined', visibleWeeks: 12, startWeek: 15 },
    });
    const loaded = loadState();
    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
    expect(loaded.operators[0].certifications).toEqual(['avsyning']);
    expect(loaded.demand.avsyning[15]).toBe(4);
  });

  it('loadState returns null when no saved state', () => {
    expect(loadState()).toBeNull();
  });

  it('clearState removes stored data', () => {
    saveState(testState);
    clearState();
    expect(loadState()).toBeNull();
  });
});

describe('theme persistence', () => {
  it('saveTheme + loadTheme roundtrip', () => {
    saveTheme('dark');
    expect(loadTheme()).toBe('dark');
  });

  it('loadTheme returns default when nothing saved', () => {
    expect(loadTheme()).toBe('default');
  });
});

describe('UI persistence', () => {
  it('saveUI + loadUI roundtrip', () => {
    saveUI({ zoom: 'day', sidebarCollapsed: true });
    const ui = loadUI();
    expect(ui.zoom).toBe('day');
    expect(ui.sidebarCollapsed).toBe(true);
  });

  it('loadUI returns empty object when nothing saved', () => {
    expect(loadUI()).toEqual({});
  });
});

describe('share links', () => {
  it('buildShareLink produces a URL with #share= hash', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://example.com', pathname: '/' },
    });
    const state = { test: true };
    const link = buildShareLink(state);
    expect(link).toContain('https://example.com/');
    expect(link).toContain('#share=');
  });

  it('handles Swedish characters in share links', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://example.com', pathname: '/' },
    });
    const state = { operators: [{ name: 'Ärlig Öberg Ålund' }] };
    const link = buildShareLink(state);
    expect(link).toContain('#share=');
    expect(link.length).toBeGreaterThan(30);
  });
});

describe('copyToClipboard', () => {
  it('uses navigator.clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    vi.stubGlobal('window', { isSecureContext: true });
    const ok = await copyToClipboard('hello');
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });
});
