import { PROCESSES } from './data';

/**
 * Parse CSV text into operator objects.
 * Expected columns: Name, Shift, Certifications (semicolon-separated)
 */
export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { operators: [], error: 'CSV must have a header row and at least one data row' };

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const nameIdx = header.indexOf('name');
  const shiftIdx = header.indexOf('shift');
  const certIdx = header.indexOf('certifications');

  if (nameIdx === -1) return { operators: [], error: 'Missing "Name" column' };

  const operators = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    const name = cols[nameIdx]?.trim();
    if (!name) continue;
    const shift = shiftIdx !== -1 ? (cols[shiftIdx]?.trim() || 'S1') : 'S1';
    const rawCerts = certIdx !== -1 ? (cols[certIdx]?.trim() || '') : '';
    const certifications = rawCerts
      .split(';')
      .map(c => c.trim())
      .filter(c => PROCESSES.includes(c));
    operators.push({ name, shift: shift.toUpperCase(), certifications });
  }
  return { operators, error: null };
}

/**
 * Merge imported operators with existing list. Match by name.
 */
export function mergeOperators(existing, imported) {
  let added = 0, updated = 0;
  const result = [...existing];
  for (const op of imported) {
    const match = result.find(e => e.name.toLowerCase() === op.name.toLowerCase());
    if (match) {
      match.shift = op.shift;
      match.certifications = op.certifications;
      updated++;
    } else {
      result.push({
        id: 'op_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        name: op.name,
        shift: op.shift,
        active: true,
        certifications: op.certifications,
      });
      added++;
    }
  }
  return { operators: result, added, updated };
}

/**
 * Download a CSV template file
 */
export function downloadCSVTemplate() {
  const header = 'Name,Shift,Certifications';
  const example = 'Anna Svensson,S1,Avsyning;Serialisering;Granskning/uttag av dok';
  const csv = header + '\n' + example + '\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'operators-template.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}
