// lib/server/request.js
// Pure request helpers for the Handler_Cores. No Next.js, React or Supabase imports.
// Works with standard Web `Headers` objects (Node 21+) and with plain header objects.

const encoder = new TextEncoder();

/** Read a header from a Web `Headers` instance or a plain object (case-insensitive). */
function readHeader(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === 'function') {
    const v = headers.get(name);
    return v == null ? null : String(v);
  }
  if (typeof headers === 'object') {
    const lower = name.toLowerCase();
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === lower) {
        const v = headers[key];
        if (v == null) return null;
        return Array.isArray(v) ? v.join(', ') : String(v);
      }
    }
  }
  return null;
}

/**
 * Parse a raw JSON request body with size and media-type limits. Never throws.
 * @param {string} text raw body text
 * @param {{ maxBytes: number, contentType?: string|null, contentLength?: string|number|null }} opts
 * @returns {{ ok: true, value: object } | { ok: false, status: 413|415|400, error: string }}
 */
export function parseJsonBody(text, { maxBytes, contentType, contentLength } = {}) {
  try {
    const ct = typeof contentType === 'string' ? contentType.trim().toLowerCase() : '';
    if (!ct.startsWith('application/json')) {
      return { ok: false, status: 415, error: 'unsupported_media_type' };
    }

    if (contentLength != null && contentLength !== '') {
      const declared = Number(contentLength);
      if (Number.isFinite(declared) && declared > maxBytes) {
        return { ok: false, status: 413, error: 'too_large' };
      }
    }

    const body = typeof text === 'string' ? text : '';
    if (encoder.encode(body).length > maxBytes) {
      return { ok: false, status: 413, error: 'too_large' };
    }

    let value;
    try {
      value = JSON.parse(body);
    } catch {
      return { ok: false, status: 400, error: 'bad_json' };
    }
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return { ok: false, status: 400, error: 'bad_json' };
    }
    return { ok: true, value };
  } catch {
    return { ok: false, status: 400, error: 'bad_json' };
  }
}

/**
 * Client IP: first comma-separated `x-forwarded-for` entry (trimmed), else `x-real-ip`, else "unknown".
 * Trusted only behind a proxy that sets these headers (e.g. Vercel).
 */
export function clientIp(headers) {
  const xff = readHeader(headers, 'x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0].trim();
    if (first) return first;
  }
  const real = readHeader(headers, 'x-real-ip');
  if (real && real.trim()) return real.trim();
  return 'unknown';
}

/**
 * True when Origin is absent; otherwise true iff `new URL(origin).host === host`.
 * Malformed Origin → false.
 */
export function isSameOrigin(originHeader, hostHeader) {
  if (originHeader == null || originHeader === '') return true;
  try {
    return new URL(String(originHeader)).host === hostHeader;
  } catch {
    return false;
  }
}
