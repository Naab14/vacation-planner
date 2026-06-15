import { migrateState } from '../schema';

export function createLocalStore({
  stateKey = 'vacation-planner-state',
  themeKey = 'vacation-planner-theme',
  uiKey = 'vacation-planner-ui',
} = {}) {
  const api = {
    getStateSync() {
      const raw = localStorage.getItem(stateKey);
      return raw ? migrateState(JSON.parse(raw)) : null;
    },
    saveStateSync(state) {
      localStorage.setItem(stateKey, JSON.stringify(migrateState(state)));
    },
    clearStateSync() {
      localStorage.removeItem(stateKey);
    },
    getThemeSync() {
      return localStorage.getItem(themeKey) || 'default';
    },
    saveThemeSync(theme) {
      localStorage.setItem(themeKey, theme);
    },
    getUISync() {
      try {
        return JSON.parse(localStorage.getItem(uiKey)) || {};
      } catch {
        return {};
      }
    },
    saveUISync(ui) {
      localStorage.setItem(uiKey, JSON.stringify(ui));
    },
    async getState() {
      return api.getStateSync();
    },
    async saveState(state) {
      api.saveStateSync(state);
    },
    async clearState() {
      api.clearStateSync();
    },
    async getTheme() {
      return api.getThemeSync();
    },
    async saveTheme(theme) {
      api.saveThemeSync(theme);
    },
    async getUI() {
      return api.getUISync();
    },
    async saveUI(ui) {
      api.saveUISync(ui);
    },
  };
  return api;
}
