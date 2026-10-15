// "Best Time to Travel" section shell (Server Component, Requirement 50).
// SeasonFilter client component is passed as children from the page, matching
// the Collections / CategoryFilter server-shell + client-component pattern.
import { formatPrice, fromPriceINR } from "@/lib/logic";
import { Reveal } from "@/components/client/Reveal";
import s from "./SeasonalSection.module.css";

const REGION_LABEL = { international: "International", domestic: "Domestic" };

/** Static INR fallback card — visible when JS is disabled (Req 50.6). */
function FallbackCard({ pkg }) {
  return (
    <li className={s.fallbackCard}>
      <p className={s.fallbackMeta}>
        <span>{REGION_LABEL[pkg.region] ?? pkg.region}</span>
        <span>{`${pkg.nights}N/${pkg.days}D`}</span>
      </p>
      <h3 className={s.fallbackTitle}>{pkg.title}</h3>
      <p className={s.fallbackPrice}>
        from {formatPrice(fromPriceINR(pkg), "INR")} /pp
      </p>
    </li>
  );
}

/**
 * @param {{ packages?: object[], children?: React.ReactNode }} props
 */
export default function SeasonalSection({ packages = [], children }) {
  const hasChildren = children != null && children !== false;

  return (
    <section id="best-time" className={`section section--alt`} aria-labelledby="best-time-title">
      <div className="container">
        <Reveal>
          <header className="section-head">
            <p className="eyebrow">Best Time to Travel</p>
            <h2 id="best-time-title">
              Plan your perfect{" "}
              <em>
                <span className="gradient-text">getaway</span>
              </em>
            </h2>
            <p className="lead">
              Packages curated for Indian travellers departing from Raipur. Select a month to see
              what&apos;s in season.
            </p>
          </header>
        </Reveal>

        {hasChildren ? (
          children
        ) : packages.length > 0 ? (
          /* No-JS static fallback (Req 50.6) */
          <ul className={s.fallbackGrid}>
            {packages.map((pkg) => (
              <FallbackCard key={pkg.id} pkg={pkg} />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
