// Root layout: self-hosted fonts (next/font), global styles, SEO metadata and
// the document shell (skip link + modal portal root). Shared by every route.
//
// Route groups below it (URLs unchanged):
//   app/(site)/layout.js   public providers + Header/Footer/FloatingWhatsApp/MobileStickyBar
//   app/(site)/page.js     home page "/"
//   app/admin/layout.js    noindex + force-dynamic for /admin/*
//   app/admin/login/       public sign-in page
//   app/admin/(protected)/ auth-gated admin pages
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { BUSINESS } from "@/lib/data";
import { buildMetadata, buildViewport } from "@/lib/seo";

// Headings, prices, numerals, review quotes, FAQ summaries. Variable font: weights 400-900,
// normal + italic (accent words are italic). Exposed as var(--font-heading).
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-heading",
});

// UI, body copy and forms. Unchanged. Exposed as var(--font-body).
const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

// Title, description, icons, Open Graph and metadataBase (Req 33.3).
export const metadata = buildMetadata(BUSINESS);
// lib/seo.js is frozen and still returns #070a1a; match --bg-0 here.
export const viewport = { ...buildViewport(), themeColor: "#070b14" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${jakarta.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {/* Route-group layouts render here; their output stays a set of <body> children. */}
        {children}
        {/* Portal target for modals (ModalProvider). Keep last in <body>: siblings are made inert. */}
        <div id="modal-root" />
      </body>
    </html>
  );
}
