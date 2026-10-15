"use client";

// Month tab filter for the "Best Time to Travel" section (Requirement 51, 52).
// Auto-selects the current calendar month after hydration via useLocalTodayISO().
import { useId, useRef, useState, useEffect } from "react";
import { MONTH_NAMES } from "@/lib/data";
import { filterPackagesBySeason, formatPrice, fromPriceINR } from "@/lib/logic";
import { useLocalTodayISO } from "@/components/client/localToday";
import { SafeImage } from "@/components/client/SafeImage";
import card from "@/components/ui/Card.module.css";
import s from "./SeasonFilter.module.css";

// Month integers 1–12 aligned with MONTH_NAMES index (MONTH_NAMES[0] = January = month 1).
const MONTHS = MONTH_NAMES.map((name, i) => ({ month: i + 1, name }));

const REGION_LABEL = { international: "International", domestic: "Domestic" };

/** One seasonal package card (Req 52). */
function SeasonCard({ pkg }) {
  const highlights = Array.isArray(pkg.highlights) ? pkg.highlights.slice(0, 2) : [];

  return (
    <li className={`${card.glass} ${s.card}`}>
      <div className={s.media}>
        <SafeImage src={pkg.image} alt={pkg.title} width={800} height={600} loading="lazy" className={s.img} />
      </div>
      <div className={s.body}>
        <p className={s.meta}>
          <span>{REGION_LABEL[pkg.region] ?? pkg.region}</span>
          <span>{`${pkg.nights}N/${pkg.days}D`}</span>
        </p>
        <h3 className={s.title}>{pkg.title}</h3>
        {highlights.length > 0 && (
          <ul className={s.highlights}>
            {highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        <p className={s.priceLine}>
          <span className={s.from}>from </span>
          <span>{formatPrice(fromPriceINR(pkg), "INR")}</span>
          <span className={s.pp}> /pp</span>
        </p>
        {/* Anchor drives visitors to the full Collections section (Req 52.3) */}
        <a href="#collections" className={s.cta} aria-label={`View ${pkg.title} in full collections`}>
          View Package →
        </a>
      </div>
    </li>
  );
}

/**
 * Month tab filter + seasonal package grid.
 * @param {{ packages?: object[] }} props
 */
export function SeasonFilter({ packages = [] }) {
  const isoDate = useLocalTodayISO();
  // Derive current month (1–12) after hydration; null before mount.
  const currentMonth = isoDate ? parseInt(isoDate.slice(5, 7), 10) : null;

  const [activeMonth, setActiveMonth] = useState(null);

  // Set active month to current month once hydrated (Req 51.3).
  useEffect(() => {
    if (currentMonth !== null && activeMonth === null) {
      setActiveMonth(currentMonth);
    }
  }, [currentMonth, activeMonth]);

  const tabRefs = useRef([]);
  const baseId = useId();
  const tabId = (m) => `${baseId}-tab-${m}`;
  const panelId = `${baseId}-panel`;

  const visible = activeMonth !== null ? filterPackagesBySeason(packages, activeMonth) : [];
  const activeIndex = activeMonth !== null ? activeMonth - 1 : -1;

  // Roving tabindex keyboard nav (Req 51.7).
  function onKeyDown(event, index) {
    const last = MONTHS.length - 1;
    let next = null;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    setActiveMonth(MONTHS[next].month);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className={s.root}>
      {/* Month tab row (Req 51.1) */}
      <div className={s.tabsScroller}>
        <div role="tablist" aria-label="Filter packages by travel month" className={s.tablist}>
          {MONTHS.map(({ month, name }, index) => {
            const selected = month === activeMonth;
            const isCurrent = month === currentMonth;
            return (
              <button
                key={month}
                ref={(node) => { tabRefs.current[index] = node; }}
                type="button"
                role="tab"
                id={tabId(month)}
                aria-selected={selected ? "true" : "false"}
                aria-controls={panelId}
                tabIndex={selected ? 0 : activeMonth === null ? (index === 0 ? 0 : -1) : -1}
                className={`${s.tab}${selected ? ` ${s.tabActive}` : ""}${isCurrent && !selected ? ` ${s.tabCurrent}` : ""}`}
                onClick={() => setActiveMonth(month)}
                onKeyDown={(e) => onKeyDown(e, index)}
              >
                {name}
                {/* Current-month indicator dot (Req 51.2) */}
                {isCurrent && (
                  <span className={s.nowDot} aria-label="current month" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Package grid (Req 51.4–51.5, 52) */}
      <div role="tabpanel" id={panelId} aria-labelledby={activeMonth !== null ? tabId(activeMonth) : undefined}>
        {activeMonth === null ? (
          <p className={s.loading}>Loading best season for you…</p>
        ) : visible.length > 0 ? (
          <ul className={s.grid}>
            {visible.map((pkg) => (
              <SeasonCard key={pkg.id} pkg={pkg} />
            ))}
          </ul>
        ) : (
          <p className={s.empty}>
            No packages curated for {MONTH_NAMES[activeMonth - 1]} yet.{" "}
            <a href="#collections">Browse all</a>
          </p>
        )}
      </div>
    </div>
  );
}

export default SeasonFilter;
