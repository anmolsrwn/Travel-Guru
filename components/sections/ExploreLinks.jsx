// Front-page gateway to the three pages split off the home page: handcrafted trips,
// the forex counter and the trip quotation. Server Component, plain links (no JS needed).
import Link from "next/link";
import { BUSINESS } from "@/lib/data";
import { Reveal } from "@/components/client/Reveal";
import card from "@/components/ui/Card.module.css";
import s from "./ExploreLinks.module.css";

const LINKS = [
  {
    href: "/trips",
    icon: "✈",
    title: "Handcrafted Trips",
    text: "Curated land packages from Raipur, priced transparently.",
    cta: "Browse trips",
  },
  {
    href: "/#custom-trips",
    icon: "🧭",
    title: "Custom Trips",
    text: "Destinations without a ready itinerary. We design the whole trip around you.",
    cta: "See custom trips",
  },
  {
    href: "/forex",
    icon: "₹",
    title: "Forex Counter",
    text: "Check indicative rates for major currencies and request a formal quote.",
    cta: "Open forex counter",
  },
  {
    href: "/quote",
    icon: "⚡",
    title: "Trip Quotation",
    text: `Tell us your dream trip. Custom quote and call back within ${BUSINESS.callbackHours} hours.`,
    cta: "Get my free quote",
  },
];

export function ExploreLinks() {
  return (
    <section id="explore" className="section" aria-labelledby="explore-title">
      <Reveal className="container">
        <div className="section-head">
          <p className="eyebrow">Start Here</p>
          <h2 id="explore-title">
            Where would you <span className="gradient-text">like to go?</span>
          </h2>
        </div>

        <ul className={s.grid} role="list">
          {LINKS.map((item) => (
            <li key={item.href} className={`${card.glass} ${card.interactive} ${s.card}`}>
              <span className={s.icon} aria-hidden="true">
                {item.icon}
              </span>
              <h3 className={s.title}>{item.title}</h3>
              <p className={s.text}>{item.text}</p>
              <Link href={item.href} className={s.link}>
                {item.cta} <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

export default ExploreLinks;
