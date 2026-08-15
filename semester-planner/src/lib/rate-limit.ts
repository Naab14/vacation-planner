/**
 * Minimal fixed-window rate limiter for auth attempts.
 * Per serverless instance (best-effort); swap for Upstash/Redis if the
 * deployment needs cross-instance guarantees.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = windows.get(key);
  if (!entry || entry.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}

export function resetRateLimit(key: string): void {
  windows.delete(key);
}
