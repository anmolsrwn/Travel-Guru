// Reviews & Trust Badges (design section 10, Req 20, 1.8, 24).
// Server Component. Rating, count and badges come from BUSINESS; cards from REVIEWS.
// Entries flagged `isPlaceholder` carry a small "Sample review" note so placeholder
// copy is never presented as a real customer's words.
import { BUSINESS, REVIEWS } from "@/lib/data";
import card from "@/components/ui/Card.module.css";
import badge from "@/components/ui/Badge.module.css";
import styles from "./Reviews.module.css";

/** Count with thousands separators, or null while not configured (Req 1.8). */
function formatCount(count) {
  return Number.isInteger(count) && count >= 0 ? count.toLocaleString("en-US") : null;
}

export function Reviews({ reviews = REVIEWS }) {
  const score = BUSINESS.rating.score.toFixed(1);
  const count = formatCount(BUSINESS.rating.count);
  const badges = [
    { label: "Verified", icon: "✓", tone: badge.emerald },
    { label: `${score} Rated`, icon: "★", tone: badge.brand },
    { label: "Trusted", icon: "✓", tone: badge.emerald },
    { label: `${BUSINESS.callbackHours}h Call Back`, icon: "⚡", tone: badge.neutral },
  ];

  return (
    <section id="reviews" className="section section--alt" aria-labelledby="reviews-title">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Verified Traveller Stories</p>
          <h2 id="reviews-title">What Our Travellers Say</h2>
          <p className={styles.rating}>
            <span className={styles.stars} aria-hidden="true">
              ★★★★★
            </span>{" "}
            <strong>{score}</strong> rated
            {count !== null && <span className={styles.count}> · {count} reviews</span>}
          </p>
        </div>

        <ul className={styles.track} aria-label="Traveller reviews">
          {reviews.map((review, i) => (
            <li key={`${review.name}-${i}`} className={`${card.glass} ${card.padded} ${styles.card}`}>
              <figure className={styles.figure}>
                <blockquote className={styles.quote}>
                  <p>{review.quote}</p>
                </blockquote>
                <figcaption className={styles.caption}>
                  <span className={styles.avatar} aria-hidden="true">
                    {review.name.charAt(0)}
                  </span>
                  <span>
                    <span className={styles.name}>{review.name}</span>, {review.city}
                  </span>
                </figcaption>
                <p className={styles.meta}>
                  <span className={styles.verified}>
                    <span aria-hidden="true">✓</span> Verified
                  </span>{" "}
                  · {review.destination}
                </p>
                {review.isPlaceholder && <p className={styles.sample}>Sample review</p>}
              </figure>
            </li>
          ))}
        </ul>

        <ul className={styles.badges} aria-label="Trust badges">
          {badges.map((b) => (
            <li key={b.label} className={`${badge.badge} ${b.tone}`}>
              <span aria-hidden="true">{b.icon}</span> {b.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Reviews;
