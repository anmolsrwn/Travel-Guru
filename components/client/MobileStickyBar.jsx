"use client";

// Mobile sticky CTA bar (Req 23.4–23.8): fixed full-width bar under 640px with
// "Get Quote" (opens the /quote page) and
// "WhatsApp" (same URL as the floating button). Hidden from 640px up.
// Body bottom padding (globals.css, --sticky-bar-h) keeps the footer uncovered.
import Link from "next/link";
import { WhatsAppButton } from "@/components/client/WhatsAppButton";
import { CONCIERGE_MESSAGE } from "@/components/client/FloatingWhatsApp";
import btn from "@/components/ui/Button.module.css";
import styles from "./MobileStickyBar.module.css";

export function MobileStickyBar() {
  return (
    <div className={styles.bar}>
      <Link href="/quote" className={`${btn.btn} ${btn.primary} ${btn.sm} ${styles.action}`}>
        <span aria-hidden="true">⚡</span> Get Quote
      </Link>
      <WhatsAppButton
        message={CONCIERGE_MESSAGE}
        className={`${btn.btn} ${btn.whatsapp} ${btn.sm} ${styles.action}`}
      >
        WhatsApp
      </WhatsAppButton>
    </div>
  );
}

export default MobileStickyBar;
