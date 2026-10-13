// tests/fakes.js
// In-memory fakes shared by the Handler_Core tests (quote, booking). No network, no Supabase.

/**
 * Fake database adapter.
 * @param {{
 *   packages?: object[],                       // published packages returned by getPublishedPackage
 *   leadScript?: Array<"ok"|"unique_violation"|"error"|"throw">,
 *   bookingScript?: Array<"ok"|"unique_violation"|"error"|"throw">,
 *   packageScript?: Array<"ok"|"throw">,
 * }} [opts]
 * Scripts are consumed one entry per call; once exhausted every call behaves as "ok".
 * "ok" also enforces real uniqueness of ticket_id / booking_ref (duplicate → unique_violation).
 */
export function createFakeDb({ packages = [], leadScript = [], bookingScript = [], packageScript = [] } = {}) {
  const leadQueue = [...leadScript];
  const bookingQueue = [...bookingScript];
  const packageQueue = [...packageScript];

  const db = {
    leads: [], // successfully stored rows
    bookings: [],
    calls: { insertLead: [], insertBooking: [], getPublishedPackage: [] }, // every argument received

    async insertLead(row) {
      db.calls.insertLead.push(row);
      return insert(leadQueue.shift() ?? "ok", row, db.leads, "ticket_id");
    },

    async insertBooking(row) {
      db.calls.insertBooking.push(row);
      return insert(bookingQueue.shift() ?? "ok", row, db.bookings, "booking_ref");
    },

    async getPublishedPackage(id) {
      db.calls.getPublishedPackage.push(id);
      if ((packageQueue.shift() ?? "ok") === "throw") throw new Error("fake getPublishedPackage failure");
      return packages.find((p) => p.id === id) ?? null;
    },
  };
  return db;
}

function insert(step, row, table, uniqueKey) {
  if (step === "throw") throw new Error("fake insert failure: secret db detail");
  if (step === "error") return { ok: false, code: "error" };
  if (step === "unique_violation") return { ok: false, code: "unique_violation" };
  if (table.some((r) => r[uniqueKey] === row[uniqueKey])) return { ok: false, code: "unique_violation" };
  table.push({ ...row });
  return { ok: true };
}

/**
 * Stub random source `(maxExclusive) → integer`. Returns the scripted values in order (mod max),
 * then counts up from the last one. Records every call in `.calls`.
 */
export function stubRandom(values = [0]) {
  const queue = [...values];
  let last = values.length ? values[values.length - 1] : 0;
  const fn = (max) => {
    fn.calls.push(max);
    const v = queue.length ? queue.shift() : ++last;
    return ((v % max) + max) % max;
  };
  fn.calls = [];
  return fn;
}

/** Recording logger `(event, meta) → void`; entries in `.entries`. */
export function recordingLog() {
  const fn = (event, meta) => {
    fn.entries.push({ event, meta });
  };
  fn.entries = [];
  return fn;
}

/** Limiter that always allows (records keys) unless `allowed` is false. */
export function fakeLimiter({ allowed = true, retryAfterMs = 0 } = {}) {
  const limiter = {
    keys: [],
    check(key, nowMs) {
      limiter.keys.push({ key, nowMs });
      return allowed ? { allowed: true, remaining: 1, retryAfterMs: 0 } : { allowed: false, remaining: 0, retryAfterMs };
    },
  };
  return limiter;
}
