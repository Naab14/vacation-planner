/** Stable machine key from a display name, e.g. "Granskning/uttag av dok" → "granskning-uttag-av-dok". */
export function slugify(name: string): string {
  return (
    name
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'process'
  );
}
