export function createLocalStore({
  stateKey = 'vacation-planner-state',
  themeKey = 'vacation-planner-theme',
  uiKey = 'vacation-planner-ui',
} = {}) {
  return {
    async getState() {
      const raw = localStorage.getItem(stateKey);
      return raw ? JSON.parse(raw) : null;
    },
    async saveState(state) {
      localStorage.setItem(stateKey, JSON.stringify(state));
    },
    async clearState() {
      localStorage.removeItem(stateKey);
    },
    async getTheme() {
      return localStorage.getItem(themeKey) || 'default';
    },
    async saveTheme(theme) {
      localStorage.setItem(themeKey, theme);
    },
    async getUI() {
      return JSON.parse(localStorage.getItem(uiKey)) || {};
    },
    async saveUI(ui) {
      localStorage.setItem(uiKey, JSON.stringify(ui));
    },
  };
}
