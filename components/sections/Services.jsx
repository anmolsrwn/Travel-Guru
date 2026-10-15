// Services section (design wireframe 4, Req 7.3, 7.4, 24.1, 24.2). Server Component.
// 9 glass cards from SERVICES in poster order; 3x3 desktop, 2-col tablet, 1-col mobile.
// The forex card also links to the /forex calculator page (forex-counter Req 6.4).
import Link from "next/link";
import { SERVICES } from "@/lib/data.js";
import { Reveal } from "@/components/client/Reveal.jsx";
import { EnquireButton } from "@/components/client/EnquireButton.jsx";
import card from "@/components/ui/Card.module.css";
import svc from "@/components/ui/Service.module.css";
import { ACCENT_CLASS, ServiceGlyph } from "@/components/ui/ServiceGlyph.jsx";
import styles from "./Services.module.css";

export function Services() {
  return (
    <section id="services" className="section section--alt" aria-labelledby="services-title">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Under One Roof</p>
          <h2 id="services-title">
            Seven services.{" "}
            <em><span className="gradient-text">One</span></em> trusted atelier.
          </h2>
          <p className="lead">Every part of your journey handled by a single consultant who knows your plans end to end.</p>
        </Reveal>

        <Reveal as="ul" className={styles.grid}>
          {SERVICES.map((service) => (
            <li key={service.id} className={`${card.glass} ${card.interactive} ${styles.card}`}>
              <span className={`${svc.iconCircle} ${ACCENT_CLASS[service.accent] ?? ""}`} aria-hidden="true">
                <ServiceGlyph name={service.icon} />
              </span>
              <h3 className={styles.title}>{service.title}</h3>
              <p className={styles.subtitle}>{service.subtitle}</p>
              <p className={styles.summary}>{service.summary}</p>
              <ul className={styles.bullets}>
                {service.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              {service.id === "forex" ? (
                <div className={styles.actions}>
                  <Link href="/forex" className={styles.enquire}>
                    Open the forex calculator <span aria-hidden="true">→</span>
                  </Link>
                  <EnquireButton
                    quoteOption={service.quoteOption}
                    label={`Enquire about ${service.title}`}
                    className={styles.enquire}
                  >
                    Enquire <span aria-hidden="true">→</span>
                  </EnquireButton>
                </div>
              ) : (
                <EnquireButton
                  quoteOption={service.quoteOption}
                  label={`Enquire about ${service.title}`}
                  className={styles.enquire}
                >
                  Enquire <span aria-hidden="true">→</span>
                </EnquireButton>
              )}
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export default Services;
