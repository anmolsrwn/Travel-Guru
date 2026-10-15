// 24h Quotation Engine section shell (Server Component; design section 8, Req 17.1, 24.1, 24.3, 27.1).
// Left panel (eyebrow, heading, guarantee badge, benefits) is static; the QuoteForm client
// component (task 13.9) mounts as `children` in the right column. A <noscript> note lists
// every contact channel, because the form needs JavaScript.
import { BUSINESS } from "@/lib/data";
import { buildWhatsAppUrl } from "@/lib/logic";
import badge from "@/components/ui/Badge.module.css";
import card from "@/components/ui/Card.module.css";
import s from "./QuoteSection.module.css";

const BENEFITS = [
  "No consultation fees, zero obligation",
  "A real consultant in Raipur, not a bot",
  "Private airport pick-up & drop on every package",
  "Partner B2B net fares on flights & hotels",
];

const WHATSAPP_GREETING = `Hi ${BUSINESS.brandName}, I would like a travel quotation.`;

/** Contact note shown when JavaScript is disabled (Req 27.1). */
export function QuoteNoscriptNote() {
  return (
    <div className={`${card.glass} ${s.noscript}`}>
      <p className={s.noscriptTitle}>The quote form needs JavaScript. You can still reach us directly:</p>
      <ul className={s.contacts}>
        {BUSINESS.phones.map((p) => (
          <li key={p.tel}>
            Call <a href={`tel:${p.tel}`}>{p.display}</a>
          </li>
        ))}
        <li>
          WhatsApp{" "}
          <a href={buildWhatsAppUrl(BUSINESS.whatsapp, WHATSAPP_GREETING)} target="_blank" rel="noopener noreferrer">
            Chat with us on WhatsApp
          </a>
        </li>
        <li>
          Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
        </li>
      </ul>
      <address className={s.address}>{BUSINESS.address}</address>
    </div>
  );
}

/**
 * @param {{ children?: React.ReactNode }} props
 */
export default function QuoteSection({ children }) {
  return (
    <section id="quote" className="section section--alt" aria-labelledby="quote-title">
      <div className={`container ${s.split}`}>
        <div className={s.panel}>
          <p className={`eyebrow ${s.extra}`}>Zero-Obligation Quote</p>
          <h2 id="quote-title" className={s.title}>
            Tell us your dream trip. <span className="gradient-text">We&apos;ll do the rest.</span>
          </h2>
          <p className={`${badge.badge} ${badge.brand} ${s.guarantee}`}>
            <span aria-hidden="true">⚡</span>
            {`Guaranteed Call Back Within ${BUSINESS.callbackHours} Hours & Custom Quotation`}
          </p>
          <ul className={`${s.benefits} ${s.extra}`}>
            {BENEFITS.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <p className={`${s.chat} ${s.extra}`}>
            Prefer chat?{" "}
            <a href={buildWhatsAppUrl(BUSINESS.whatsapp, WHATSAPP_GREETING)} target="_blank" rel="noopener noreferrer">
              Message us on WhatsApp.
            </a>
          </p>
        </div>

        <div className={s.formCol}>
          {children}
          <noscript>
            <QuoteNoscriptNote />
          </noscript>
        </div>
      </div>
    </section>
  );
}
