import { migrateState } from './schema';
import { appStore } from './store';

let debounceTimer = null;

export function saveState(state) {
  try { appStore.saveStateSync(state); }
  catch (e) { console.warn('Failed to save state:', e); }
}

export function loadState() {
  try {
    return appStore.getStateSync();
  } catch (e) { console.warn('Failed to load state:', e); return null; }
}

export function clearState() { appStore.clearStateSync(); }

export function saveTheme(t) { appStore.saveThemeSync(t); }
export function loadTheme() { return appStore.getThemeSync(); }

export function saveUI(ui) {
  try { appStore.saveUISync(ui); } catch { /* ignore */ }
}
export function loadUI() {
  try { return appStore.getUISync(); } catch { return {}; }
}

export function exportJSON(state) {
  const blob = new Blob([JSON.stringify(migrateState(state), null, 2)], { type: 'application/json' });
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
        try { resolve(migrateState(JSON.parse(ev.target.result))); }
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

/* ── Share via URL ─────────────────────────────────────────────────────────
 * Encode the workspace as a compressed base64 string in the URL hash so
 * users can share a snapshot with a colleague by sending the link.
 */
function utf8ToBase64(str) {
  // Safely handle Unicode (names with å/ä/ö).
  return btoa(unescape(encodeURIComponent(str)));
}
function base64ToUtf8(b64) {
  return decodeURIComponent(escape(atob(b64)));
}

export function buildShareLink(state) {
  const payload = utf8ToBase64(JSON.stringify(migrateState(state)));
  const base = window.location.origin + window.location.pathname;
  return `${base}#share=${payload}`;
}

export function loadStateFromUrl() {
  const hash = window.location.hash || '';
  const m = hash.match(/#share=([^&]+)/);
  if (!m) return null;
  try {
    return migrateState(JSON.parse(base64ToUtf8(m[1])));
  } catch (e) {
    console.warn('Failed to parse shared state:', e);
    return null;
  }
}

export function clearShareHash() {
  if (window.location.hash.includes('#share=')) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    console.warn('Copy failed:', e);
    return false;
  }
}
