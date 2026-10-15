// Next.js 16 proxy (the renamed middleware) guarding /admin/*.
// It refreshes the Supabase session cookies and redirects signed-out visitors
// to /admin/login. This is an optimistic gate only: every admin page and
// server action re-checks the user and the admins membership on the server.
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const LOGIN_PATH = "/admin/login";
const ROBOTS_HEADER = ["X-Robots-Tag", "noindex, nofollow"];

/**
 * @param {import("next/server").NextRequest} request
 */
export async function proxy(request) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without Supabase config, let the request through; the admin layout
  // renders "Database not configured".
  if (!url || !anonKey) {
    response.headers.set(...ROBOTS_HEADER);
    return response;
  }

  // Headers the library asks us to send with refreshed cookies (no-store etc.).
  const authHeaders = {};

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        // Mirror the refreshed cookies onto the request so downstream server
        // code sees them, then rebuild the response and set them there too.
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        Object.assign(authHeaders, headers);
      },
    },
  });

  // Do not run code between createServerClient and getClaims(): it refreshes an expired
  // session (cookie refresh) and verifies the JWT signature locally, so there is no Auth
  // server round trip on every /admin request. Pages and actions re-check on the server.
  let user = null;
  try {
    const { data } = await supabase.auth.getClaims();
    user = data?.claims?.sub ? data.claims : null;
  } catch {
    user = null;
  }

  const { pathname } = request.nextUrl;
  const isLogin = pathname === LOGIN_PATH || pathname === `${LOGIN_PATH}/`;

  if (!user && !isLogin) {
    const redirect = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    // Carry any cookie changes (e.g. cleared stale session) onto the redirect.
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    response = redirect;
  }

  for (const [key, value] of Object.entries(authHeaders)) {
    response.headers.set(key, value);
  }
  response.headers.set(...ROBOTS_HEADER);
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
