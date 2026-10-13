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
          </div>
        </div>
      </div>
    </section>
  );
}

export default Expert;
