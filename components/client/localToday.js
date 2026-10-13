// Visitor-device local date (design 5.4 client-side access rules, Req 16.5).
import { useSyncExternalStore } from "react";

/** Local calendar date of this device as "YYYY-MM-DD" (built from local Date fields). */
export function localTodayISO(now = new Date()) {
  const y = String(now.getFullYear()).padStart(4, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const noopSubscribe = () => () => {};
const serverSnapshot = () => null;

/**
 * Local today ISO, or null on the server and during hydration (so server HTML and
 * the hydrating render match). Re-read on each render after mount.
 * @returns {string | null}
 */
export function useLocalTodayISO() {
  return useSyncExternalStore(noopSubscribe, localTodayISO, serverSnapshot);
}
