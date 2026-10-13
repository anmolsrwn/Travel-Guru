// Hero (Req 5.1–5.8, 5.11, 33.5, 33.6, 1.6, 1.8). Server Component.
// The background photo is a CSS background on a decorative layer, so a failed
// load simply leaves the --bg-0 fill under the overlay (Req 5.11).
// The image itself is preloaded by app/(site)/page.js (Req 5.9).
import { BUSINESS } from "@/lib/data";
import { WhatsAppButton } from "@/components/client/WhatsAppButton";
import btn from "@/components/ui/Button.module.css";
import styles from "./Hero.module.css";

export function Hero() {
  const { rating, callbackHours, brandName, heroImage } = BUSINESS;

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div
        className={styles.bg}
        style={{ "--hero-image": `url(${JSON.stringify(heroImage)})` }}
        aria-hidden="true"
      />
      <div className={styles.overlay} aria-hidden="true" />

      <div className={`container ${styles.inner}`}>
        <p className="eyebrow">Raipur&rsquo;s Direct Travel Agency</p>

        <h1 id="hero-title" className={`display ${styles.title}`}>
          Journeys crafted by hand,{" "}
          <span className={styles.line}>
            not by <span className="gradient-text">algorithms.</span>
          </span>
        </h1>

        <p className={`lead ${styles.copy}`}>
          Vietnam, Thailand, Malaysia, Dubai and beyond. Tours, flights, hotels, cruises,
          rail, forex and visas under one roof, planned by a real consultant in Raipur.
        </p>

        <div className={styles.ctas}>
          <a href="#quote" className={`${btn.btn} ${btn.primary}`}>
            <span aria-hidden="true">⚡</span>
            Get My Custom Quote
          </a>
          <WhatsAppButton message={`Hi ${brandName}, I'd like help planning a trip.`}>
            WhatsApp Us
          </WhatsAppButton>
        </div>

        <p className={`glass ${styles.badge}`}>
          <span className={styles.badgeIcon} aria-hidden="true">⚡</span>
          <span>
            <strong>Guaranteed Call Back &amp; Custom Quotation</strong>
            <br />
            Within {callbackHours} hours. Zero obligation.
          </span>
        </p>

        <ul className={styles.trust} role="list">
          <li>
            <span className={styles.star} aria-hidden="true">★★★★★</span>{" "}
            {rating.score} rated
          </li>
          <li><span className={styles.tick} aria-hidden="true">✓</span> Verified</li>
          <li><span className={styles.tick} aria-hidden="true">✓</span> Private airport transfers</li>
          <li><span className={styles.tick} aria-hidden="true">✓</span> 24x7 customer support</li>
        </ul>
      </div>
    </section>
  );
}

export default Hero;
