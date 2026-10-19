// Popular Destinations section shell (Server Component; design section 6, Req 35.1, 27.1).
// The DestinationTiles client component (task 13.x) mounts as `children` and renders both
// grids; without children the shell renders the International and Domestic grids statically,
// with "Get a Quote" / "View Package" as in-page links so the page works without JavaScript.
import Link from "next/link";
import { destinationsByRegion } from "@/lib/logic";
import btn from "@/components/ui/Button.module.css";
import card from "@/components/ui/Card.module.css";
import s from "./Destinations.module.css";

const GRIDS = [
  { region: "international", title: "International" },
  { region: "domestic", title: "Domestic" },
];

function DestinationTile({ dest, hasPackage }) {
  return (
    <li className={`${card.glass} ${s.tile}`}>
      <div className={s.media}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dest.image} alt={dest.name} width={800} height={600} loading="lazy" decoding="async" />
      </div>
      <div className={s.body}>
        <h3 className={s.name}>{dest.name}</h3>
        <p className={s.tagline}>{dest.tagline}</p>
        <div className={s.actions}>
          <Link className={`${btn.btn} ${btn.secondary} ${btn.sm}`} href="/quote" aria-label={`Get a Quote for ${dest.name}`}>
            Get a Quote
          </Link>
          {hasPackage ? (
            <Link
              className={`${btn.btn} ${btn.primary} ${btn.sm}`}
              href="/trips"
              aria-label={`View Package for ${dest.name}`}
            >
              View Package
            </Link>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/**
 * @param {{
 *   destinations?: object[],
 *   packages?: object[],
 *   seasonal?: React.ReactNode,
 *   children?: React.ReactNode
 * }} props
 */
export default function Destinations({ destinations = [], packages = [], seasonal, children }) {
  const hasChildren = children != null && children !== false;
  const packageIds = new Set(packages.map((p) => p.id));
  return (
    <section id="destinations" className="section" aria-labelledby="destinations-title">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow">Plan Your Next Getaway</p>
          <h2 id="destinations-title">Where would you like to go?</h2>
          <p className="lead">Pick a destination, or start with what is best this month.</p>
        </header>

        {seasonal ?? null}

        {hasChildren
          ? children
          : GRIDS.map(({ region, title }) => {
              const list = destinationsByRegion(destinations, region);
              if (list.length === 0) return null;
              const headingId = `destinations-${region}`;
              return (
                <div key={region} className={s.group} aria-labelledby={headingId} role="group">
                  <h3 id={headingId} className={s.groupTitle}>
                    {title}
                  </h3>
                  <ul className={`${s.grid} ${region === "domestic" ? s.grid4 : s.grid3}`}>
                    {list.map((d) => (
                      <DestinationTile key={d.id} dest={d} hasPackage={d.packageId != null && packageIds.has(d.packageId)} />
                    ))}
                  </ul>
                </div>
              );
            })}
      </div>
    </section>
  );
}
