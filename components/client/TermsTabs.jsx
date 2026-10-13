"use client";

// Terms & Policies tabs / accordion (Req 31.1–31.5, 31.7, 31.8, 25.7, 25.12, 24.7).
//
// One set of seven panels, each keeping its deep-link id (#terms-inclusions …), so no id
// is ever duplicated. Presentation is chosen by `data-mode` on the root:
//   - "static"    server render / before hydration: every panel open with its heading,
//                 so the content reads without JavaScript (Req 27.1);
//   - "tabs"      ≥ 1024px: role="tablist"/"tab"/"tabpanel", aria-selected, roving
//                 tabindex with ←/→/Home/End (selection follows focus);
//   - "accordion" < 1024px: <h3><button aria-expanded aria-controls></h3> headers, one
//                 panel open at a time, collapsed panels `inert`.
// Tabs and accordion share one selection, so resizing keeps the same panel open.
//
// Content: panel bodies come from the server-safe `TermsPanelBody` in the Terms section
// (POLICIES / BUSINESS.paymentPolicy defaults). lib/data is already in the client bundle
// (Header, CurrencyProvider), so rendering here keeps the API simple: `<TermsTabs />`.
//
// Deep links: the URL hash is read through useSyncExternalStore (initial load and
// hashchange). A matching `terms-*` hash opens that panel and scrolls to it.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { TERMS_PANELS, TermsPanelBody } from "@/components/sections/Terms";
import acc from "@/components/ui/Accordion.module.css";
import s from "./TermsTabs.module.css";

const DESKTOP_QUERY = "(min-width: 1024px)";
const PANEL_IDS = new Set(TERMS_PANELS.map((p) => p.id));
const FIRST_ID = TERMS_PANELS[0].id;

const noopSubscribe = () => () => {};

function subscribeDesktop(onChange) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function subscribeHash(onChange) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/** "#terms-payment" → "terms-payment" when it names a panel, else null. */
export function panelFromHash(hash) {
  const id = typeof hash === "string" ? decodeURIComponent(hash.replace(/^#/, "")) : "";
  return PANEL_IDS.has(id) ? id : null;
}

/**
 * @param {{ policies?: object, paymentPolicy?: object }} props
 *   Optional overrides; default to POLICIES / BUSINESS.paymentPolicy inside TermsPanelBody.
 */
export function TermsTabs({ policies, paymentPolicy }) {
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false
  );
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => "");
  const hashPanel = panelFromHash(hash);

  // `hash` records the URL hash at the time of the visitor's choice: a later, different
  // terms-* hash wins over the choice; otherwise the choice wins.
  const [choice, setChoice] = useState({ id: FIRST_ID, hash: null });
  const active = hashPanel && hash !== choice.hash ? hashPanel : choice.id;
  const selectedTab = active ?? FIRST_ID; // tabs always have exactly one selection

  const mode = !hydrated ? "static" : isDesktop ? "tabs" : "accordion";
  const tabRefs = useRef({});
  const scrolledHash = useRef(null);

  // Scroll the opened deep-link panel into view (once per hash value). scroll-padding-top
  // on <html> keeps it below the fixed header.
  useEffect(() => {
    if (mode === "static" || !hashPanel || scrolledHash.current === hash) return;
    scrolledHash.current = hash;
    const target =
      mode === "tabs" ? document.getElementById("terms-tabs") : document.getElementById(`${hashPanel}-acc`);
    target?.scrollIntoView({ block: "start" });
  }, [mode, hash, hashPanel]);

  function select(id) {
    setChoice({ id, hash });
  }

  function toggle(id) {
    setChoice({ id: active === id ? null : id, hash });
  }

  function onTabKeyDown(event, index) {
    const last = TERMS_PANELS.length - 1;
    let next;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;
    event.preventDefault();
    const id = TERMS_PANELS[next].id;
    select(id);
    tabRefs.current[id]?.focus();
  }

  return (
    <div id="terms-tabs" className={s.root} data-mode={mode}>
      <div role="tablist" aria-label="Terms and policies" className={s.tablist}>
        {TERMS_PANELS.map((p, i) => {
          const selected = p.id === selectedTab;
          return (
            <button
              key={p.id}
              ref={(el) => {
                tabRefs.current[p.id] = el;
              }}
              type="button"
              role="tab"
              id={`${p.id}-tab`}
              className={s.tab}
              aria-selected={selected ? "true" : "false"}
              aria-controls={p.id}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(p.id)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className={`${acc.list} ${s.panels}`}>
        {TERMS_PANELS.map((p) => {
          const open = mode === "static" || p.id === active;
          const shown = mode === "tabs" ? p.id === selectedTab : open;
          return (
            <div key={p.id} className={`${acc.item} ${s.item} ${open ? acc.open : ""}`}>
              <h3 className={`${acc.heading} ${s.heading}`}>
                <button
                  type="button"
                  id={`${p.id}-acc`}
                  className={`${acc.trigger} ${s.trigger}`}
                  aria-expanded={open ? "true" : "false"}
                  aria-controls={p.id}
                  onClick={() => toggle(p.id)}
                >
                  <span>{p.title}</span>
                  <span className={acc.icon} aria-hidden="true" />
                </button>
              </h3>
              <div
                id={p.id}
                className={`${acc.panel} ${s.panel}`}
                role={mode === "tabs" ? "tabpanel" : "region"}
                aria-labelledby={mode === "tabs" ? `${p.id}-tab` : `${p.id}-acc`}
                tabIndex={mode === "tabs" ? 0 : undefined}
                hidden={mode === "tabs" && !shown}
                inert={mode === "accordion" && !shown}
              >
                <div className={acc.panelInner}>
                  <div className={s.content}>
                    <TermsPanelBody id={p.id} policies={policies} paymentPolicy={paymentPolicy} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TermsTabs;
