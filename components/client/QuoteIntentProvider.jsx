"use client";

// Quote intent: cross-section prefill of the QuoteForm without global DOM queries on
// form fields (Req 7.5–7.7, 35.4, design 5.4).
//
//   const { intent, enquireService, quoteDestination, consumeIntent } = useQuoteIntent();
//
//   enquireService(quoteOption)  scroll to #quote, then publish
//                                { type: "service", value: quoteOption, nonce }
//   quoteDestination(name)       scroll to #quote, then publish
//                                { type: "destination", value: name,
//                                  service: DESTINATION_QUOTE_SERVICE, nonce }
//   intent                       latest unconsumed intent, or null
//   consumeIntent(nonce)         clear `intent` if its nonce still matches (call after applying)
//
// Consumer contract (QuoteForm, task 13.9): in an effect keyed on `intent?.nonce`,
//   - "service":     check `value` (never uncheck; keep other checked services) and
//                    clear the `services` error + aria-invalid (Req 7.5–7.7)
//   - "destination": set the destinations field to `value` (replace), check `service`
//                    while keeping the others, clear `services` and `destinations`
//                    errors (Req 35.4)
//   then call consumeIntent(intent.nonce). `nonce` increases on every call, so
//   repeating the same request still produces a new intent.
//
// Scrolling: `html { scroll-padding-top: var(--header-h) }` lands the top of #quote at
// the bottom edge of the 72px header. Smooth unless prefers-reduced-motion. Focus moves
// (without a second scroll) to an element marked `data-quote-focus` inside #quote if
// present, otherwise to the section heading #quote-title (made focusable with tabindex=-1).
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { DESTINATION_QUOTE_SERVICE } from "@/lib/data";

export const QUOTE_SECTION_ID = "quote";
const QUOTE_HEADING_ID = "quote-title";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/** Scroll #quote under the header and move focus into it. No-op on the server. */
export function scrollToQuote() {
  if (typeof document === "undefined") return;
  const section = document.getElementById(QUOTE_SECTION_ID);
  if (!section) {
    window.location.hash = QUOTE_SECTION_ID; // section not mounted: plain anchor fallback
    return;
  }
  section.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });

  const target = section.querySelector("[data-quote-focus]") ?? document.getElementById(QUOTE_HEADING_ID);
  if (target && typeof target.focus === "function") {
    if (!target.matches("a[href], button, input, select, textarea, [tabindex]")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }
}

const QuoteIntentContext = createContext(null);

/** Provides the quote intent to the tree. Wraps the public site in app/(site)/layout.js (inside ModalProvider). */
export function QuoteIntentProvider({ children }) {
  const [intent, setIntent] = useState(null);
  const nonceRef = useRef(0);

  const publish = useCallback((next) => {
    nonceRef.current += 1;
    setIntent({ ...next, nonce: nonceRef.current });
    scrollToQuote();
  }, []);

  const enquireService = useCallback(
    (quoteOption) => {
      if (typeof quoteOption !== "string" || quoteOption === "") return;
      publish({ type: "service", value: quoteOption });
    },
    [publish],
  );

  const quoteDestination = useCallback(
    (name) => {
      if (typeof name !== "string" || name.trim() === "") return;
      publish({ type: "destination", value: name, service: DESTINATION_QUOTE_SERVICE });
    },
    [publish],
  );

  const consumeIntent = useCallback((nonce) => {
    setIntent((prev) => (prev && (nonce === undefined || prev.nonce === nonce) ? null : prev));
  }, []);

  const value = useMemo(
    () => ({ intent, enquireService, quoteDestination, consumeIntent }),
    [intent, enquireService, quoteDestination, consumeIntent],
  );

  return <QuoteIntentContext.Provider value={value}>{children}</QuoteIntentContext.Provider>;
}

/**
 * @returns {{
 *   intent: null | { type: "service", value: string, nonce: number }
 *                | { type: "destination", value: string, service: string, nonce: number },
 *   enquireService: (quoteOption: string) => void,
 *   quoteDestination: (name: string) => void,
 *   consumeIntent: (nonce?: number) => void,
 * }}
 */
export function useQuoteIntent() {
  const ctx = useContext(QuoteIntentContext);
  if (!ctx) throw new Error("useQuoteIntent must be used inside <QuoteIntentProvider>");
  return ctx;
}

export default QuoteIntentProvider;
