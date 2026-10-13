// Admin area shell (Requirement 42.8). Applies to every /admin route,
// including /admin/login:
//   - robots noindex/nofollow metadata (next.config.js / proxy.js add X-Robots-Tag)
//   - force-dynamic, so nothing under /admin is prerendered or cached by ISR
//
// Structure (route groups do not change URLs):
//   app/admin/layout.js               this file: metadata + dynamic only, no auth
//   app/admin/login/page.js           public sign-in page (must stay outside the
//                                     auth check, or it would redirect to itself)
//   app/admin/(protected)/layout.js   auth gate + admin nav + Sign out
//   app/admin/(protected)/**/page.js  /admin, /admin/bookings, /admin/packages, …
//
// The public site chrome (Header, Footer, floating buttons, providers) lives in
// app/(site)/layout.js, so none of it renders here.

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }) {
  return children;
}
