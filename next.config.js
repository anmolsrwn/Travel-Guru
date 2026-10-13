// Next.js configuration: security headers for every route (Requirement 45.1, 45.2)
// and noindex on the admin area (Requirement 42.8).
import { IMAGE_HOSTS } from "./lib/data.js";

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

// Origin of the Supabase project (e.g. https://abc.supabase.co), used only in img-src
// for Storage images. Missing or invalid values are skipped so the build never fails.
function supabaseOrigin() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
}

function buildCsp() {
  const imgSources = ["'self'", "data:", "blob:", ...IMAGE_HOSTS.map((host) => `https://${host}`)];
  const supabase = supabaseOrigin();
  if (supabase && !imgSources.includes(supabase)) imgSources.push(supabase);

  // script-src 'unsafe-inline': Next.js emits inline bootstrap/hydration scripts. A nonce-based
  // CSP would force dynamic rendering for every page and defeat ISR, so this is a documented
  // trade-off, mitigated by React escaping and the ban on dangerouslySetInnerHTML.
  // 'unsafe-eval' is added only in development (React Refresh / dev overlay need it).
  const scriptSources = ["'self'", "'unsafe-inline'"];
  if (isDev) scriptSources.push("'unsafe-eval'");

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    // next/font and React inline style attributes need 'unsafe-inline' for styles.
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSources.join(" ")}`,
    // Fonts are self-hosted by next/font (served from /_next/static/media), so no Google origin.
    "font-src 'self'",
    // The browser never talks to Supabase directly: all reads/writes go through route handlers,
    // server components and server actions on our own origin. In development the HMR websocket
    // is same-origin as well. wa.me / tel: / mailto: links are navigations, not fetches, and are
    // not governed by connect-src.
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  // Only in production: some browsers (Safari) would upgrade http://localhost in development.
  if (isProd) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: buildCsp() },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
