"use client";

// Popular Destinations tiles (design section 6, Req 35, 24.1–24.3).
// Mounted as `children` of the Destinations Server Component shell, which drops its own
// static grids/headings when children are passed. A segmented region toggle (WAI-ARIA tabs)
// shows one region grid at a time. Layout classes are shared with the shell (Destinations.module.css).
import { useEffect, useRef, useState } from "react";
import { destinationsByRegion } from "@/lib/logic";
import { SafeImage } from "@/components/client/SafeImage";
import { useQuoteIntent } from "@/components/client/QuoteIntentProvider";
import { useModal } from "@/components/client/ModalProvider";
import "@/components/client/ItineraryModal"; // side effect: registerModal("itinerary", …)
import btn from "@/components/ui/Button.module.css";
import card from "@/components/ui/Card.module.css";
import s from "@/components/sections/Destinations.module.css";

// "custom" holds destinations with no ready package/itinerary (quote only).
const CUSTOM_HASH = "#custom-trips";
const REGIONS = [
  { region: "international", title: "International", gridClass: s.grid3 },
  { region: "domestic", title: "Domestic", gridClass: s.grid4 },
  { region: "custom", title: "Custom Trips", gridClass: s.grid4 },
];

/**
 * @param {{ destinations?: object[], packages?: object[] }} props
 */
export function DestinationTiles({ destinations = [], packages = [] }) {
  const { quoteDestination } = useQuoteIntent();
  const modal = useModal();
  const [requested, setRequested] = useState(null);
  const tabRefs = useRef({});

  // Deep link from the home gateway card: /#custom-trips opens the Custom Trips tab.
  useEffect(() => {
    const sync = () => {
      if (window.location.hash === CUSTOM_HASH) setRequested("custom");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const packagesById = new Map(
    (Array.isArray(packages) ? packages : []).filter((p) => p && p.id != null).map((p) => [p.id, p]),
  );
  const hasPackage = (d) => d.packageId != null && packagesById.has(d.packageId);
  const all = Array.isArray(destinations) ? destinations.filter(Boolean) : [];

  // Packaged destinations stay under their region; the rest move to Custom Trips.
  const listFor = (region) =>
    region === "custom"
      ? all.filter((d) => !hasPackage(d))
      : destinationsByRegion(all, region).filter(hasPackage);

  const available = REGIONS.filter((r) => listFor(r.region).length > 0);
  // Derived each render so the active tab falls back if content changes.
  const activeDef = available.find((r) => r.region === requested) ?? available[0];
  if (!activeDef) return null;

  const list = listFor(activeDef.region);
  const showToggle = available.length > 1;
  const tabId = (region) => `destinations-tab-${region}`;
  const panelId = "destinations-panel";

  function onKeyDown(event) {
    const idx = available.findIndex((r) => r.region === activeDef.region);
    let next = -1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (idx + 1) % available.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (idx - 1 + available.length) % available.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = available.length - 1;
    if (next < 0) return;
    event.preventDefault();
    const target = available[next].region;
    setRequested(target);
    tabRefs.current[target]?.focus();
  }

  return (
    <div>
      <span id="custom-trips" className={s.anchor} aria-hidden="true" />
      {showToggle ? (
        <div className={s.regionTabs}>
          <div className={s.regionTablist} role="tablist" aria-label="Destination region" onKeyDown={onKeyDown}>
            {available.map(({ region, title }) => {
              const selected = region === activeDef.region;
              return (
                <button
                  key={region}
                  ref={(el) => {
                    tabRefs.current[region] = el;
                  }}
                  type="button"
                  role="tab"
                  id={tabId(region)}
                  className={s.regionTab}
                  aria-selected={selected}
                  aria-controls={panelId}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setRequested(region)}
                >
                  {title}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <div
        id={panelId}
        role={showToggle ? "tabpanel" : "group"}
        aria-labelledby={showToggle ? tabId(activeDef.region) : undefined}
        aria-label={showToggle ? undefined : activeDef.title}
      >
        <ul className={`${s.grid} ${activeDef.gridClass}`}>
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
    </div>
  );
}

export default DestinationTiles;
