// lib/server/forexRates.js
// Live mid-market forex rates, shared by GET /api/forex-rates and the forex quote handler so the
// quote the server stores matches what the visitor saw. Source: open.er-api.com (free, no key,
// refreshed about once a day). Units match CURRENCIES[x].rate: units of currency per 1 INR.
import { CURRENCIES, FOREX_CURRENCIES } from "../data.js";

const SOURCE_URL = "https://open.er-api.com/v6/latest/INR";
const TIMEOUT_MS = 6000;

/**
 * Fetch the live rates for FOREX_CURRENCIES. Never throws.
 * @returns {Promise<{ rates: Record<string, number>, updatedAt: string | null } | null>} null when unavailable
 */
export async function fetchLiveForexRates() {
  try {
    const res = await fetch(SOURCE_URL, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.result !== "success" || typeof data.rates !== "object" || data.rates === null) return null;

    const rates = {};
    for (const code of FOREX_CURRENCIES) {
      const rate = data.rates[code];
      if (!Number.isFinite(rate) || rate <= 0) return null;
      rates[code] = rate;
    }
    const updatedAt = Number.isFinite(data.time_last_update_unix)
      ? new Date(data.time_last_update_unix * 1000).toISOString()
      : null;
    return { rates, updatedAt };
  } catch {
    return null;
  }
}

/** CURRENCIES with live rates swapped in; CURRENCIES itself when `live` is null. */
export function currenciesWithLiveRates(live) {
  if (!live) return CURRENCIES;
  const merged = { ...CURRENCIES };
  for (const code of FOREX_CURRENCIES) {
    if (Number.isFinite(live.rates[code]) && live.rates[code] > 0) {
      merged[code] = { ...CURRENCIES[code], rate: live.rates[code] };
    }
  }
  return merged;
}
