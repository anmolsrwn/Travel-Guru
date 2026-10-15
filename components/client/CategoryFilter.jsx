"use client";

// Curated Collections category tabs + package cards (design section 5, Req 8, 10.7, 25.7, 24.1–24.3).
// Mounted as `children` of the Collections Server Component shell, which keeps the
// section heading and the pricing note (Req 32.4) server-rendered.
import { useId, useRef, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/data";
import { filterPackages, formatPrice, fromPriceINR, isPackageInSeason } from "@/lib/logic";
import { useLocalTodayISO } from "@/components/client/localToday";
import { SafeImage } from "@/components/client/SafeImage";
import { useModal } from "@/components/client/ModalProvider";
import { CurrencySwitcher } from "@/components/client/CurrencyProvider";
import "@/components/client/ItineraryModal"; // side effect: registerModal("itinerary", …)
import "@/components/client/CheckoutModal"; // side effect: registerModal("checkout", …)
import btn from "@/components/ui/Button.module.css";
import badge from "@/components/ui/Badge.module.css";
import card from "@/components/ui/Card.module.css";
import shell from "@/components/sections/Collections.module.css";
import s from "./CategoryFilter.module.css";

const REGION_LABEL = { international: "International", domestic: "Domestic" };
const EXTRAS_NOTE = {
  international: "+ flights & visa priced separately",
  domestic: "+ flights priced separately",
};

/**
 * One package card.
 * @param {{ pkg: object, currentMonth: number|null, onViewItinerary: (pkg: object, trigger: HTMLElement) => void, onBook: (pkg: object, trigger: HTMLElement) => void }} props
 */
function PackageCard({ pkg, currentMonth, onViewItinerary, onBook }) {
  const facts = [pkg.hotelStarRating != null ? `${pkg.hotelStarRating}★` : null, pkg.mealPlan].filter(Boolean);
  const highlights = Array.isArray(pkg.highlights) ? pkg.highlights.slice(0, 2) : [];
  // Only show badge after hydration (currentMonth non-null) to avoid SSR mismatch (Req 53.5).
  const inSeason = currentMonth !== null && isPackageInSeason(pkg, currentMonth);

  return (
    <li className={`${card.glass} ${shell.card}`}>
      <div className={shell.media}>
        <SafeImage src={pkg.image} alt={pkg.title} width={800} height={600} className={s.image} />
      </div>
      <div className={shell.body}>
        <p className={shell.meta}>
          <span>{REGION_LABEL[pkg.region] ?? pkg.region}</span>
          <span>{`${pkg.nights}N/${pkg.days}D`}</span>
        </p>
        <h3 className={shell.title}>{pkg.title}</h3>
        {facts.length > 0 ? <p className={shell.facts}>{facts.join(" · ")}</p> : null}
        {pkg.isSample ? <span className={`${badge.badge} ${badge.neutral}`}>Sample itinerary</span> : null}
        {/* In-Season badge — after isSample chip, before highlights (Req 53.3, 53.7) */}
        {inSeason ? (
          <span className={`${badge.badge} ${badge.emerald}`}>
            <span aria-hidden="true">✓</span> In Season
          </span>
        ) : null}
        {highlights.length > 0 ? (
          <ul className={shell.highlights}>
            {highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        ) : null}
        <p className={shell.priceLine}>
          <span className={shell.from}>from </span>
          <span className="price" data-price-inr={fromPriceINR(pkg)}>
            {formatPrice(fromPriceINR(pkg), "INR")}
          </span>
          <span className={shell.pp}> /pp</span>
        </p>
        <p className={shell.land}>land package</p>
        <p className={shell.extras}>{EXTRAS_NOTE[pkg.region] ?? EXTRAS_NOTE.international}</p>
        <div className={s.actions}>
          <button
            type="button"
            className={`${btn.btn} ${btn.secondary} ${btn.sm}`}
            data-action="view-itinerary"
            data-package-id={pkg.id}
            aria-label={`View itinerary for ${pkg.title}`}
            onClick={(event) => onViewItinerary(pkg, event.currentTarget)}
          >
            View Itinerary
          </button>
          <button
            type="button"
            className={`${btn.btn} ${btn.primary} ${btn.sm}`}
            data-action="book"
            data-package-id={pkg.id}
            aria-label={`Book ${pkg.title}`}
            onClick={(event) => onBook(pkg, event.currentTarget)}
          >
            Book Now
          </button>
        </div>
      </div>
    </li>
  );
}

/**
 * Category tabs, currency switcher and the filtered package grid.
 * @param {object} props
 * @param {object[]} [props.packages] published packages (plain objects)
 * @param {(pkg: object) => void} [props.onViewItinerary] overrides the default
 *   "View Itinerary" behaviour (open ItineraryModal via useModal, trigger = the button)
 * @param {(pkg: object) => void} [props.onBook] overrides the default "Book Now"
 *   behaviour (open the "checkout" modal)
 */
export function CategoryFilter({ packages = [], onViewItinerary, onBook }) {
  const modal = useModal();
  const [active, setActive] = useState("all");

  // Derive current month for in-season badge (Req 53.1); null before hydration.
  const isoDate = useLocalTodayISO();
  const currentMonth = isoDate ? parseInt(isoDate.slice(5, 7), 10) : null;

  function viewItinerary(pkg, trigger) {
    if (onViewItinerary) onViewItinerary(pkg);
    else modal.open("itinerary", { pkg }, trigger);
  }

  function book(pkg, trigger) {
    if (onBook) {
      onBook(pkg);
      return;
    }
    try {
      modal.open("checkout", { pkg }, trigger);
    } catch {
      // "checkout" is registered by CheckoutModal (task 13.7); ignore until then.
    }
  }
  const tabRefs = useRef([]);
  const baseId = useId();
  const tabId = (id) => `${baseId}-tab-${id}`;
  const panelId = `${baseId}-panel`;

  const visible = filterPackages(packages, active);

  // Roving tabindex: arrows / Home / End move focus and select (automatic activation).
  function onKeyDown(event, index) {
    const last = CATEGORIES.length - 1;
    let next = null;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    setActive(CATEGORIES[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className={s.root}>
      <div className={s.controls}>
        <div className={s.tabsScroller}>
          <div role="tablist" aria-label="Filter packages by category" className={s.tablist}>
            {CATEGORIES.map((cat, index) => {
              const selected = cat.id === active;
              return (
                <button
                  key={cat.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={tabId(cat.id)}
                  aria-selected={selected ? "true" : "false"}
                  aria-controls={panelId}
                  tabIndex={selected ? 0 : -1}
                  className={s.tab}
                  onClick={() => setActive(cat.id)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>


      </div>

      <div role="tabpanel" id={panelId} aria-labelledby={tabId(active)}>
        {visible.length > 0 ? (
          <ul className={shell.grid}>
            {visible.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} currentMonth={currentMonth} onViewItinerary={viewItinerary} onBook={book} />
            ))}
          </ul>
        ) : (
          <p className={shell.empty}>
            No journeys here yet. <Link href="/quote">Ask us to craft one →</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default CategoryFilter;
