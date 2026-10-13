"use client";

// Floating WhatsApp concierge (Req 23.1–23.3, 23.5): 60px circle fixed 24px from the
// bottom-right, 2s pulsing ring, tooltip on hover/focus. Opens wa.me in a new tab via
// WhatsAppButton (noopener, same-tab fallback when popups are blocked).
import { BUSINESS } from "@/lib/data";
import { WhatsAppButton, WhatsAppIcon } from "@/components/client/WhatsAppButton";
import styles from "./FloatingWhatsApp.module.css";

/** Greeting shared by the floating button and the mobile sticky bar (Req 23.3, 23.8). */
export const CONCIERGE_MESSAGE = `Hi ${BUSINESS.brandName}, I'd like help planning a trip.`;

export function FloatingWhatsApp() {
  const tooltip = `Typically replies in under ${BUSINESS.whatsappResponseMins} mins`;
  return (
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
  );
}

export default FloatingWhatsApp;
