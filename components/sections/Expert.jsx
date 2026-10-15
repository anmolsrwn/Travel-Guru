// "Your Travel Expert" section (design section 9, Req 36, 24.1–24.3).
// Server Component: all copy comes from BUSINESS.expert / BUSINESS.phones.
//
// Photo fallback (Req 36.5): the frame always contains the CSS "TG" Logo_Mark
// (same markup/styles as LogoImage's fallback) as a bottom layer, with SafeImage
// absolutely positioned on top. A loaded photo covers the mark. When the photo is
// missing or fails, SafeImage swaps to its placeholder <span>; this section makes
// that placeholder transparent (span.photo), so the Logo_Mark shows through at the
// frame's fixed 4:5 dimensions. The placeholder keeps role="img" + the alt text,
// and the underlying mark is aria-hidden, so the accessible name never duplicates.
import { BUSINESS } from "@/lib/data";
import { SafeImage } from "@/components/client/SafeImage";
import { WhatsAppButton } from "@/components/client/WhatsAppButton";
import btn from "@/components/ui/Button.module.css";
import logo from "@/components/client/LogoImage.module.css";
import styles from "./Expert.module.css";

const PHOTO_W = 480;
const PHOTO_H = 600; // 4:5

/** Name is shown only when it is a non-empty string (Req 36.2, 36.3). */
function expertName(expert) {
  return typeof expert.name === "string" && expert.name.trim() !== "" ? expert.name.trim() : null;
}

export function Expert() {
  const { expert, phones, brandName } = BUSINESS;
  const name = expertName(expert);
  const alt = name ? `${name}, ${expert.role}` : expert.role;
  const phone = phones[0];
  const greeting = `Hi ${brandName}, I'd like to talk to your travel expert about planning a trip.`;

  return (
    <section id="expert" className="section" aria-labelledby="expert-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.media}>
          <div className={styles.frame}>
            <span className={`${logo.mark} ${styles.mark}`} aria-hidden="true">
              <span className={logo.initials}>{BUSINESS.logoInitials}</span>
            </span>
            <SafeImage
              src={expert.photo}
              alt={alt}
              width={PHOTO_W}
              height={PHOTO_H}
              className={styles.photo}
            />
          </div>
        </div>

        <div className={styles.body}>
          <p className="eyebrow">Your Travel Expert</p>
          <h2 id="expert-title" className={styles.title}>
            {name ?? "Meet Your Travel Expert"}
          </h2>
          <p className={styles.role}>{expert.role}</p>
          <p className={styles.bio}>{expert.bio}</p>

          <div className={styles.actions}>
            <a href={`tel:${phone.tel}`} className={`${btn.btn} ${btn.primary} ${styles.action}`}>
              <svg className={btn.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" />
              </svg>
              Call {phone.display}
            </a>
            <WhatsAppButton message={greeting} className={`${btn.btn} ${btn.whatsapp} ${styles.action}`}>
              WhatsApp
            </WhatsAppButton>
            {BUSINESS.instagram && (
              <a
                href={BUSINESS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btn.btn} ${btn.secondary} ${styles.action} ${styles.socialBtn}`}
                aria-label="Follow us on Instagram"
              >
                <svg className={btn.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
                Instagram
              </a>
            )}
            {BUSINESS.facebook && (
              <a
                href={BUSINESS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btn.btn} ${btn.secondary} ${styles.action} ${styles.socialBtn}`}
                aria-label="Follow us on Facebook"
              >
                <svg className={btn.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                </svg>
                Facebook
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Expert;
