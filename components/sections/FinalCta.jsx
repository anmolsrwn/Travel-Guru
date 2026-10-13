// Final CTA band (Req 22.1, 22.2, 22.3, 33.6, 1.6). Server Component.
import { BUSINESS } from "@/lib/data";
import { WhatsAppButton } from "@/components/client/WhatsAppButton";
import { Reveal } from "@/components/client/Reveal";
import btn from "@/components/ui/Button.module.css";
import styles from "./FinalCta.module.css";

export function FinalCta() {
  const { brandName } = BUSINESS;

  return (
    <section id="final-cta" className={`section ${styles.band}`} aria-labelledby="final-cta-title">
      <Reveal className={`container ${styles.inner}`}>
        <h2 id="final-cta-title" className={styles.title}>
          Book Your Next Adventure With <span className="gradient-text">{brandName}</span>
        </h2>
        <div className={styles.ctas}>
          <a href="#quote" className={`${btn.btn} ${btn.primary}`}>
            <span aria-hidden="true">⚡</span>
            Get My Free Quote
          </a>
          <WhatsAppButton message={`Hi ${brandName}, I'd like to plan my next adventure.`}>
            Chat on WhatsApp
          </WhatsAppButton>
        </div>
      </Reveal>
    </section>
  );
}

export default FinalCta;
