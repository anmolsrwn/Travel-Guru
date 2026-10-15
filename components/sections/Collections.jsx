// Curated Collections section shell (Server Component; design section 5, Req 8, 32.4, 27.1).
// The CategoryFilter client component (task 13.5) mounts as `children`; without children the
// shell renders every package as a static INR card so the page reads without JavaScript.
import { BUSINESS } from "@/lib/data";
import { formatPrice, fromPriceINR } from "@/lib/logic";
import btn from "@/components/ui/Button.module.css";
import badge from "@/components/ui/Badge.module.css";
import card from "@/components/ui/Card.module.css";
import s from "./Collections.module.css";

const REGION_LABEL = { international: "International", domestic: "Domestic" };
const EXTRAS_NOTE = {
  international: "+ flights & visa priced separately",
  domestic: "+ flights priced separately",
};

/** Static INR package card (no-JS fallback). */
function PackageCard({ pkg }) {
  const fromINR = fromPriceINR(pkg);
  return (
    <li className={`${card.glass} ${s.card}`}>
      <div className={s.media}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pkg.image} alt={pkg.title} width={800} height={600} loading="lazy" decoding="async" />
      </div>
      <div className={s.body}>
        <p className={s.meta}>
          <span>{REGION_LABEL[pkg.region] ?? pkg.region}</span>
          <span>{`${pkg.nights}N/${pkg.days}D`}</span>
        </p>
        <h3 className={s.title}>{pkg.title}</h3>
        <p className={s.facts}>
          {[pkg.hotelStarRating != null ? `${pkg.hotelStarRating}★` : null, pkg.mealPlan].filter(Boolean).join(" · ")}
        </p>
        {pkg.isSample ? <span className={`${badge.badge} ${badge.neutral}`}>Sample itinerary</span> : null}
        {Array.isArray(pkg.highlights) && pkg.highlights.length > 0 ? (
          <ul className={s.highlights}>
            {pkg.highlights.slice(0, 2).map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        ) : null}
        <p className={s.priceLine}>
          <span className={s.from}>from </span>
          <span className="price" data-price-inr={fromINR}>
            {formatPrice(fromINR, "INR")}
          </span>
          <span className={s.pp}> /pp</span>
        </p>
        <p className={s.land}>land package</p>
        <p className={s.extras}>{EXTRAS_NOTE[pkg.region] ?? EXTRAS_NOTE.international}</p>
        <a className={`${btn.btn} ${btn.secondary} ${btn.sm}`} href="#quote" aria-label={`Get a quote for ${pkg.title}`}>
          Get a Quote
        </a>
      </div>
    </li>
  );
}

/**
 * @param {{ packages?: object[], children?: React.ReactNode }} props
 */
export default function Collections({ packages = [], children }) {
  const hasChildren = children != null && children !== false;
  return (
    <section id="collections" className="section" aria-labelledby="collections-title">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow">Curated Collections</p>
          <h2 id="collections-title">
            Handcrafted journeys, <em><span className="gradient-text">priced transparently</span></em>
          </h2>
          <p className="lead">Land packages from our recent itineraries. Flights from Raipur are quoted separately at live fares.</p>
        </header>

        {hasChildren ? (
          children
        ) : packages.length > 0 ? (
          <ul className={s.grid}>
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </ul>
        ) : (
          <p className={s.empty}>
            No journeys here yet. <a href="#quote">Ask us to craft one →</a>
          </p>
        )}

        <p className={`caption ${s.note}`}>
          {`Prices per person, land package only, subject to availability. Quotes are valid for ${BUSINESS.quoteValidityHours} hours.`}
        </p>
      </div>
    </section>
  );
}
