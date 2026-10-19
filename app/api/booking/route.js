// app/api/booking/route.js
// POST /api/booking: thin Next.js wiring around the pure handleBooking core (design 5.6).
// Public and unauthenticated by design; protected by the same-origin check, rate limiting and
// body limits inside handleBooking, which recomputes every amount from the database Package
// (Requirements 38.1, 39.1, 39.3).
import { randomInt } from "node:crypto";
import { handleBooking } from "@/lib/server/booking";
import { notifyBooking } from "@/lib/server/notify";
import { createRateLimiter } from "@/lib/server/rate-limit";
import { API_LIMITS, RATE_LIMITS } from "@/lib/data";
import { getBookingDb } from "@/lib/supabase/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Module scope: one limiter per server instance (best-effort, resets on cold start).
const limiter = createRateLimiter(RATE_LIMITS.booking);

/** Logs event codes and numeric metadata only; never request bodies or personal data. */
function log(event, meta) {
  console.warn("[api/booking]", event, meta ?? {});
}

function json(body, status, headers = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export async function POST(request) {
  // Reject oversized bodies before reading them when the client declares the size.
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > API_LIMITS.maxBodyBytes) {
    return json({ ok: false, error: "too_large" }, 413);
  }

  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }

  try {
    const res = await handleBooking({
      rawBody,
      headers: request.headers,
      now: new Date(),
      // max is 2**32 for booking refs; randomInt allows max - min <= 2**48.
      random: (max) => randomInt(0, max),
      db: getBookingDb(),
      limiter,
      log,
      notify: (row, bookingRef) => notifyBooking(row, bookingRef, log),
    });
    return json(res.body, res.status, res.headers);
  } catch {
    log("booking.unhandled_error");
    return json({ ok: false, error: "server_error" }, 500);
  }
}
