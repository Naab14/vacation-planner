export type CsvValue = string | number | boolean | null | undefined;

/** RFC 4180 escaping: quote when the value contains a comma, quote, or newline. */
export function csvEscape(value: CsvValue): string {
  if (value == null) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(headers: readonly string[], rows: readonly (readonly CsvValue[])[]): string {
  const lines = [headers, ...rows].map((row) => row.map(csvEscape).join(','));
  return lines.join('\r\n') + '\r\n';
}
