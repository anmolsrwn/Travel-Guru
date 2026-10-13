"use client";

// Popular Destinations tiles (design section 6, Req 35, 24.1–24.3).
// Mounted as `children` of the Destinations Server Component shell, which drops its own
// static grids/headings when children are passed, so both groups and their headings are
// rendered here. Layout classes are shared with the shell (Destinations.module.css).
import { destinationsByRegion } from "@/lib/logic";
import { SafeImage } from "@/components/client/SafeImage";
import { useQuoteIntent } from "@/components/client/QuoteIntentProvider";
import { useModal } from "@/components/client/ModalProvider";
import "@/components/client/ItineraryModal"; // side effect: registerModal("itinerary", …)
import btn from "@/components/ui/Button.module.css";
import card from "@/components/ui/Card.module.css";
import s from "@/components/sections/Destinations.module.css";

const GRIDS = [
  { region: "international", title: "International", gridClass: s.grid3 },
  { region: "domestic", title: "Domestic", gridClass: s.grid4 },
];

/**
 * @param {{ destinations?: object[], packages?: object[] }} props
 */
export function DestinationTiles({ destinations = [], packages = [] }) {
  const { quoteDestination } = useQuoteIntent();
  const modal = useModal();

  const packagesById = new Map(
    (Array.isArray(packages) ? packages : []).filter((p) => p && p.id != null).map((p) => [p.id, p]),
  );

  return GRIDS.map(({ region, title, gridClass }) => {
    const list = destinationsByRegion(destinations, region);
    if (list.length === 0) return null;
    const headingId = `destinations-${region}`;
    return (
      <div key={region} className={s.group} role="group" aria-labelledby={headingId}>
        <h3 id={headingId} className={s.groupTitle}>
          {title}
        </h3>
        <ul className={`${s.grid} ${gridClass}`}>
          {list.map((dest) => {
            const pkg = dest.packageId != null ? packagesById.get(dest.packageId) : undefined;
            return (
              <li key={dest.id} className={`${card.glass} ${s.tile}`}>
                <div className={s.media}>
                  <SafeImage src={dest.image} alt={dest.name} width={800} height={600} />
                </div>
                <div className={s.body}>
                  <h3 className={s.name}>{dest.name}</h3>
                  <p className={s.tagline}>{dest.tagline}</p>
                  <div className={s.actions}>
                    <button
                      type="button"
                      className={`${btn.btn} ${btn.secondary} ${btn.sm}`}
                      data-action="destination-quote"
                      aria-label={`Get a Quote for ${dest.name}`}
                      onClick={() => quoteDestination(dest.name)}
                    >
                      Get a Quote
                    </button>
                    {pkg ? (
                      <button
                        type="button"
                        className={`${btn.btn} ${btn.primary} ${btn.sm}`}
                        data-action="view-package"
                        data-package-id={pkg.id}
                        aria-label={`View Package for ${dest.name}`}
                        onClick={(event) => modal.open("itinerary", { pkg }, event.currentTarget)}
                      >
                        View Package
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  });
}

export default DestinationTiles;
