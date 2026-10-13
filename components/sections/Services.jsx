// Services section (design wireframe 4, Req 7.3, 7.4, 24.1, 24.2). Server Component.
// 8 glass cards from SERVICES in poster order; 4+4 desktop, 2-col tablet, 1-col mobile.
import { SERVICES } from "@/lib/data.js";
import { Reveal } from "@/components/client/Reveal.jsx";
import { EnquireButton } from "@/components/client/EnquireButton.jsx";
import card from "@/components/ui/Card.module.css";
import svc from "@/components/ui/Service.module.css";
import { ACCENT_CLASS, ServiceGlyph } from "@/components/ui/ServiceGlyph.jsx";
import styles from "./Services.module.css";

export function Services() {
  return (
    <section id="services" className="section" aria-labelledby="services-title">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Under One Roof</p>
          <h2 id="services-title">Complete Travel Solutions Under One Roof</h2>
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
              <EnquireButton
                quoteOption={service.quoteOption}
                label={`Enquire about ${service.title}`}
                className={styles.enquire}
              >
                Enquire <span aria-hidden="true">→</span>
              </EnquireButton>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export default Services;
