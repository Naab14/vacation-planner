const STATE_KEY = 'vacation-planner-state';
const THEME_KEY = 'vacation-planner-theme';
let debounceTimer = null;

export function saveState(state) {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
  catch (e) { console.warn('Failed to save state:', e); }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { console.warn('Failed to load state:', e); return null; }
}

export function clearState() { localStorage.removeItem(STATE_KEY); }

export function saveTheme(t) { localStorage.setItem(THEME_KEY, t); }
export function loadTheme() { return localStorage.getItem(THEME_KEY) || 'default'; }

export function exportJSON(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vacation-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importJSON() {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = ev => {
        try { resolve(JSON.parse(ev.target.result)); }
        catch { resolve(null); }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

export function debouncedSave(state, delay = 500) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => saveState(state), delay);
}
