"use server";
// Admin auth Server Actions (design 5.7): signIn and signOut only.
// Lead, booking, package and destination mutations live next to their pages
// (leads-actions.js, bookings/actions.js, packages/actions.js, ...).
// Sign-in only: there is deliberately no sign-up action (Requirement 42.1).
import { headers } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { createRateLimiter } from "@/lib/server/rate-limit";
import { clientIp } from "@/lib/server/request";
import { RATE_LIMITS } from "@/lib/data";

// Module scope: one limiter per server instance (best-effort, Requirement 39.1).
const loginLimiter = createRateLimiter(RATE_LIMITS.login);

const MAX_EMAIL = 254;
const MAX_PASSWORD = 1024;

// Not exported: a 'use server' module may only export async functions.
const MESSAGES = Object.freeze({
  invalid: "Invalid email or password",
  tooMany: "Too many attempts. Try again later.",
  notConfigured: "Database not configured",
  unavailable: "Sign-in is unavailable right now. Try again later.",
});

/**
 * useActionState-compatible sign-in action.
 * Returns { error } on failure; redirects (replacing the history entry) to /admin on success.
 * @param {{ error?: string } | undefined} _prevState
 * @param {FormData} formData
 */
export async function signIn(_prevState, formData) {
  const rawEmail = formData?.get("email");
  const rawPassword = formData?.get("password");
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";

  // Rate limit every attempt, before any credential check (Requirement 39.1, 42.6).
  const ip = clientIp(await headers());
  if (!loginLimiter.check(`login:${ip}`, Date.now()).allowed) {
    return { error: MESSAGES.tooMany };
  }

  if (!email || !password || email.length > MAX_EMAIL || password.length > MAX_PASSWORD) {
    return { error: MESSAGES.invalid };
  }

  const supabase = await createSessionClient();
  if (!supabase) return { error: MESSAGES.notConfigured };

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // Same message for unknown email and wrong password (no account enumeration).
    if (error) return { error: MESSAGES.invalid };
  } catch {
    return { error: MESSAGES.unavailable };
  }

  // redirect() throws, so it stays outside the try block. "replace" swaps the login page out of
  // the history, so Back from the admin area does not return to the sign-in form.
  redirect("/admin", RedirectType.replace);
}

/** Ends the Supabase session, clears its cookies and returns to the login page (Requirement 42.7). */
export async function signOut() {
  const supabase = await createSessionClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Still leave the admin area; proxy.js re-checks the session on every request.
    }
  }
  redirect("/admin/login");
}
