// Trust strip (Req 6.1, 6.2, 6.6, 1.8, 32.1). Server Component.
// Only verifiable claims; every number comes from BUSINESS / SERVICES.
import { BUSINESS } from "@/lib/data";
import { Reveal } from "@/components/client/Reveal";
import styles from "./TrustStrip.module.css";

export function TrustStrip() {
  const { callbackHours } = BUSINESS;

  const items = [
    { key: "airlines", value: "450+", label: "Global airlines" },
    { key: "services", value: "7 in 1", label: "Services, one consultant" },
    { key: "callback", value: `${callbackHours}h`, label: "Call-back guarantee" },
    { key: "b2b", value: "B2B", label: "Partner net fares" },
  ];

  return (
    <section className={`section--alt ${styles.strip}`} aria-label="Why travellers trust us">
      <Reveal className="container">
        <ul className={styles.list} role="list">
          {items.map((item) => (
            <li key={item.key} className={styles.item}>
              <b className={styles.value}>{item.value}</b>
              <span className={styles.label}>{item.label}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

export default TrustStrip;
