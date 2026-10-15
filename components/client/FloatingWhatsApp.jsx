"use client";

// Floating WhatsApp concierge (Req 23.1–23.3, 23.5): 60px circle fixed 24px from the
// bottom-right, 2s pulsing ring, tooltip on hover/focus. Opens wa.me in a new tab via
// WhatsAppButton (noopener, same-tab fallback when popups are blocked).
// Instagram and Facebook icon buttons are stacked above it.
import { BUSINESS } from "@/lib/data";
import { WhatsAppButton, WhatsAppIcon } from "@/components/client/WhatsAppButton";
import styles from "./FloatingWhatsApp.module.css";

/** Greeting shared by the floating button and the mobile sticky bar (Req 23.3, 23.8). */
export const CONCIERGE_MESSAGE = `Hi ${BUSINESS.brandName}, I'd like help planning a trip.`;

/** Instagram SVG icon, decorative. */
function InstagramIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

/** Facebook SVG icon, decorative. */
function FacebookIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

export function FloatingWhatsApp() {
  const tooltip = `Chat with us on WhatsApp`;
  return (
    <div className={styles.stack}>
      {/* Instagram */}
      {BUSINESS.instagram && (
        <a
          href={BUSINESS.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.socialFab} ${styles.instaFab}`}
          aria-label={`${BUSINESS.brandName} on Instagram`}
        >
          <InstagramIcon className={styles.glyph} />
        </a>
      )}

      {/* Facebook */}
      {BUSINESS.facebook && (
        <a
          href={BUSINESS.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.socialFab} ${styles.fbFab}`}
          aria-label={`${BUSINESS.brandName} on Facebook`}
        >
          <FacebookIcon className={styles.glyph} />
        </a>
      )}

      {/* WhatsApp */}
      <WhatsAppButton
        message={CONCIERGE_MESSAGE}
        className={styles.fab}
        icon={false}
        ariaLabel={`Chat with ${BUSINESS.brandName} on WhatsApp. ${tooltip}`}
      >
        <WhatsAppIcon className={styles.glyph} />
        <span className={styles.tooltip} aria-hidden="true">
          {tooltip}
        </span>
      </WhatsAppButton>
    </div>
  );
}

export default FloatingWhatsApp;
