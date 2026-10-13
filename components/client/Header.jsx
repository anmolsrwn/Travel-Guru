"use client";

// Fixed site header (Req 4.1–4.10, 33.1, 33.2, 33.5).
// - 72px on every viewport, transparent until the page scrolls past 40px, then
//   --bg-0 at 90% with a backdrop blur (state flips in the same scroll event).
// - In-page links are plain anchors: `html { scroll-padding-top: var(--header-h);
//   scroll-behavior: smooth }` in globals.css lands each section below the header.
// - < 640px the single <nav> becomes a drawer that slides in from the right
//   (350ms), toggled by the hamburger (aria-expanded / aria-controls), closed by
//   any link inside it or Escape (focus returns to the hamburger).
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BUSINESS } from "@/lib/data";
import { LogoImage } from "@/components/client/LogoImage";
import { CurrencySwitcher } from "@/components/client/CurrencyProvider";
import btn from "@/components/ui/Button.module.css";
import styles from "./Header.module.css";

/** Header navigation, in the order of Req 4.1. */
export const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "Collections", href: "#collections" },
  { label: "Destinations", href: "#destinations" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Reviews", href: "#reviews" },
  { label: "FAQ", href: "#faq" },
  { label: "Terms", href: "#terms" },
];

export const QUOTE_HREF = "#quote";
const SCROLL_THRESHOLD = 40;
const NAV_ID = "site-nav";
const MOBILE_QUERY = "(max-width: 639.98px)";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);

  // Scroll state (Req 4.3, 4.4). Initial check covers reloads mid-page.
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  // Escape closes the drawer and returns focus to the hamburger (Req 4.10);
  // growing past the mobile breakpoint closes it so no stale state remains.
  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    const mq = window.matchMedia(MOBILE_QUERY);
    function onChange(event) {
      if (!event.matches) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    mq.addEventListener("change", onChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      mq.removeEventListener("change", onChange);
    };
  }, [open]);

  const headerClass = [styles.header, scrolled && styles.scrolled, open && styles.open]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClass} data-scrolled={scrolled ? "true" : "false"}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand}>
          <LogoImage size={48} priority />
          <span className={styles.brandText}>
            <span className={styles.brandName}>{BUSINESS.brandName}</span>
            <span className={styles.tagline}>{BUSINESS.tagline}</span>
          </span>
        </Link>

        {/* Inline on tablet and up; right-hand drawer below 640px. */}
        <nav id={NAV_ID} className={styles.nav} aria-label="Primary">
          <ul className={styles.links}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={styles.link} onClick={close}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={QUOTE_HREF}
            className={`${btn.btn} ${btn.primary} ${btn.block} ${styles.drawerCta}`}
            onClick={close}
          >
            Get Free Quote
          </a>
        </nav>

        <div className={styles.actions}>
          <CurrencySwitcher variant="select" className={styles.currency} />
          <a href={QUOTE_HREF} className={`${btn.btn} ${btn.primary} ${btn.sm} ${styles.cta}`}>
            Get Free Quote <span aria-hidden="true">✦</span>
          </a>
          <button
            ref={toggleRef}
            type="button"
            className={styles.toggle}
            aria-label="Menu"
            aria-expanded={open ? "true" : "false"}
            aria-controls={NAV_ID}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={styles.bars} aria-hidden="true" />
          </button>
        </div>
      </div>
      {/* Tap outside the drawer to close it (mobile only, decorative). */}
      <div className={styles.scrim} aria-hidden="true" onClick={close} />
    </header>
  );
}

export default Header;
