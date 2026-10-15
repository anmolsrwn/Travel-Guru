// app/api/forex-rates/route.js
// GET /api/forex-rates: live mid-market rates for the supported forex currencies.
// Public, read-only and unauthenticated by design: it only relays public exchange-rate data and
// never receives user input. See lib/server/forexRates.js for the source and units.
import { fetchLiveForexRates } from "@/lib/server/forexRates";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  const live = await fetchLiveForexRates();
  if (!live) {
    return Response.json({ ok: false, error: "unavailable" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json(
    { ok: true, rates: live.rates, updatedAt: live.updatedAt },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
