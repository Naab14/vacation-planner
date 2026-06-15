/**
 * Derive a stable visual identity (initials + colour) for an operator from a
 * string key. Deterministic, so the same operator always gets the same colour
 * across the employee list, board rows, and certification matrix — no data to
 * store, works for imported operators too.
 */
const PALETTE = [
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function operatorInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function operatorColor(key = '') {
  return PALETTE[hash(key) % PALETTE.length];
}

export function operatorIcon(op) {
  const key = op?.id || op?.name || '';
  return { initials: operatorInitials(op?.name), color: operatorColor(key) };
}
