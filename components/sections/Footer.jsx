// Footer (Server Component, Req 22.4–22.8, 33.1, 33.5, 33.6).
// Four columns (brand, services, company, contact), the office address, the motto and
// a bottom line with the year and the indicative-price notices. Every business value
// comes from BUSINESS so a single edit in lib/data.js updates the footer.
import { BUSINESS, SERVICES } from "@/lib/data";
import { buildWhatsAppUrl } from "@/lib/logic";
import { todayISOInZone } from "@/lib/server/time";
import { LogoImage } from "@/components/client/LogoImage";
import badge from "@/components/ui/Badge.module.css";
import styles from "./Footer.module.css";

/** "https://travelgururaipur.com/" -> "travelgururaipur.com" */
function displayWebsite(url) {
  return url.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

// In-page links to the home page sections (header-offset scrolling is handled in CSS).
const COMPANY_LINKS = [
  { label: "About", href: "#expert" },
  { label: "FAQ", href: "#faq" },
  { label: "Terms & Policies", href: "#terms" },
];

export function Footer() {
  // Read on the server at render/revalidation time in the business time zone.
  const year = todayISOInZone(new Date(), BUSINESS.timeZone).slice(0, 4);
  const whatsappUrl = buildWhatsAppUrl(
    BUSINESS.whatsapp,
    `Hi ${BUSINESS.brandName}, I'd like help planning a trip.`,
  );
  const { score, count } = BUSINESS.rating;

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.columns}>
          {/* (a) Brand */}
          <div className={styles.brandCol}>
            <LogoImage size={64} />
            <p className={styles.brandName}>{BUSINESS.brandName}</p>
            <p className={styles.tagline}>{BUSINESS.tagline}</p>
            <p className={styles.rating}>
              <span aria-hidden="true">★</span> {score}
              {count != null && <> ({count.toLocaleString("en-IN")} reviews)</>}
              <span className="sr-only"> out of 5 rating</span>
            </p>
            <ul className={styles.badges} aria-label="Trust badges">
              {BUSINESS.badges.map((b) => (
                <li key={b} className={`${badge.badge} ${badge.emerald}`}>
                  <span aria-hidden="true">✓</span> {b}
                </li>
              ))}
            </ul>
          </div>

          {/* (b) Services */}
          <nav className={styles.col} aria-label="Footer services">
            <h2 className={styles.heading}>Services</h2>
            <ul className={styles.list}>
              {SERVICES.map((s) => (
                <li key={s.id}>
                  <a href="#services">{s.title}</a>
                </li>
              ))}
            </ul>
          </nav>

          {/* (c) Company */}
          <nav className={styles.col} aria-label="Footer company">
            <h2 className={styles.heading}>Company</h2>
            <ul className={styles.list}>
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          {/* (d) Contact */}
          <div className={styles.col}>
            <h2 className={styles.heading}>Contact</h2>
            <ul className={styles.list}>
              {BUSINESS.phones.map((p) => (
                <li key={p.tel}>
                  <a href={`tel:${p.tel}`}>{p.display}</a>
                </li>
              ))}
              <li>
                <a href={`mailto:${BUSINESS.email}`} className={styles.breakable}>
                  {BUSINESS.email}
                </a>
              </li>
              <li>
                <a href={BUSINESS.website} target="_blank" rel="noopener noreferrer">
                  {displayWebsite(BUSINESS.website)}
                </a>
              </li>
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.whatsapp}
                >
                  WhatsApp
                </a>
              </li>
              {BUSINESS.instagram && (
                <li>
                  <a
                    href={BUSINESS.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.instagram}
                  >
                    Instagram
                  </a>
                </li>
              )}
              {BUSINESS.facebook && (
                <li>
                  <a
                    href={BUSINESS.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.facebook}
                  >
                    Facebook
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <address className={styles.address}>{BUSINESS.address}</address>
        <p className={`gradient-text ${styles.motto}`}>{BUSINESS.motto}</p>

        <div className={styles.bottom}>
          <p>
            © {year} {BUSINESS.brandName}
          </p>
          <p>Prices indicative, subject to availability</p>
          <p>Non-INR prices are indicative conversions</p>
          <p className={styles.legal}>
            {/* Privacy content is an open item; points at the Terms disclaimer for now. */}
            <a href="#terms-disclaimer">Privacy</a>
            <a href="#terms">Terms</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
