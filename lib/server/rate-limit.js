// lib/server/rate-limit.js
// In-memory sliding-window log rate limiter (design 7.23). Pure: no Next.js, React or Supabase imports.
// Best-effort only: state lives in one server instance and resets on restart or cold start.

/**
 * @param {{ limit: number, windowMs: number, maxKeys?: number }} options
 * @returns {{ check(key: string, nowMs: number): { allowed: boolean, remaining: number, retryAfterMs: number } }}
 */
export function createRateLimiter({ limit, windowMs, maxKeys = 10000 }) {
  const hits = new Map(); // key → ascending timestamps within the window; Map order = LRU order
  return {
    check(key, nowMs) {
      const log = (hits.get(key) ?? []).filter((t) => nowMs - t < windowMs);
      if (log.length >= limit) {
        hits.set(key, log);
        return { allowed: false, remaining: 0, retryAfterMs: windowMs - (nowMs - log[0]) };
      }
      log.push(nowMs);
      hits.delete(key);
      hits.set(key, log); // re-insert = most recently used
      if (hits.size > maxKeys) hits.delete(hits.keys().next().value); // evict least recently used key
      return { allowed: true, remaining: limit - log.length, retryAfterMs: 0 };
    },
  };
}
