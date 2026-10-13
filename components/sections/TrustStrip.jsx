// Trust strip (Req 6.1, 6.2, 6.6, 1.8, 32.1). Server Component.
// Only verifiable claims; every number comes from BUSINESS / SERVICES.
import { BUSINESS, SERVICES } from "@/lib/data";
import { Reveal } from "@/components/client/Reveal";
import styles from "./TrustStrip.module.css";

export function TrustStrip() {
  const { rating, callbackHours } = BUSINESS;
  const hasCount = Number.isInteger(rating.count);

  const items = [
    {
      key: "rating",
      content: (
        <>
          <span className={styles.star} aria-hidden="true">★</span> {rating.score} Rated
          {hasCount && <> ({rating.count.toLocaleString("en-IN")} reviews)</>} ·{" "}
          <span className={styles.tick} aria-hidden="true">✓</span> Verified
        </>
      ),
    },
    { key: "services", content: `${SERVICES.length} Services, 1 Expert` },
    { key: "callback", content: `${callbackHours}h Call Back Guarantee` },
    { key: "office", content: "Office at VIP Chowk, Telibandha, Raipur" },
  ];

  return (
    <section className={`section--alt ${styles.strip}`} aria-label="Why travellers trust us">
      <Reveal className="container">
        <ul className={styles.list} role="list">
          {items.map((item) => (
            <li key={item.key} className={styles.item}>
              {item.content}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

export default TrustStrip;
