"use client";

// Currency selection shared by every price on the page (Req 9.7, 10.1-10.9, 26.3, 27.6).
//
// Hydration-safe: the server snapshot (and therefore the first client render while
// hydrating) is always the Base_Currency INR, matching the server HTML. Right after
// hydration React re-reads the client snapshot, which restores `tg.currency` from
// localStorage. An unsupported stored value resolves to INR and is overwritten in an
// effect. Every storage access is wrapped in try/catch: when storage is unavailable
// the choice lives in memory for the page session and no error is shown.
//
// Only the currency code is ever written to storage (Req 26.3).
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import { BUSINESS, CURRENCIES } from "@/lib/data";
import { convertPrice, formatPrice } from "@/lib/logic";
import seg from "@/components/ui/Segmented.module.css";
import field from "@/components/ui/Field.module.css";
import styles from "./CurrencyProvider.module.css";

export const CURRENCY_STORAGE_KEY = "tg.currency";
const BASE_CURRENCY = BUSINESS.baseCurrency;
/** Supported codes in display order (INR, USD, EUR, GBP, AUD, AED, SGD). */
export const CURRENCY_CODES = Object.keys(CURRENCIES);

function isSupportedCurrency(code) {
  return typeof code === "string" && Object.hasOwn(CURRENCIES, code);
}

// ---------------------------------------------------------------------------
// Module-level store (one per browser page). Never touched on the server.
// ---------------------------------------------------------------------------

let current = null; // resolved code; null until first client read
const listeners = new Set();

function readStored() {
  try {
    return window.localStorage.getItem(CURRENCY_STORAGE_KEY);
  } catch {
    return null; // storage unavailable or blocked
  }
}

function writeStored(code) {
  try {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, code);
  } catch {
    // swallowed: keep the in-memory choice for this session (Req 10.9, 27.6)
  }
}

function getSnapshot() {
  if (current === null) {
    const stored = readStored();
    current = isSupportedCurrency(stored) ? stored : BASE_CURRENCY;
  }
  return current;
}

function getServerSnapshot() {
  return BASE_CURRENCY;
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function storeSet(code) {
  if (!isSupportedCurrency(code)) return;
  writeStored(code);
  if (code === current) return;
  current = code;
  listeners.forEach((listener) => listener());
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CurrencyContext = createContext({ currency: BASE_CURRENCY, setCurrency: () => {} });

/** Provides `{ currency, setCurrency }` to the tree. Wraps the public site in app/(site)/layout.js. */
export function CurrencyProvider({ children }) {
  const currency = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Invalid stored value → overwrite with the Base_Currency (Req 10.6).
  useEffect(() => {
    const stored = readStored();
    if (stored !== null && !isSupportedCurrency(stored)) writeStored(BASE_CURRENCY);
  }, []);

  const setCurrency = useCallback((code) => storeSet(code), []);
  const value = useMemo(() => ({ currency, setCurrency }), [currency, setCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

/** @returns {{ currency: string, setCurrency: (code: string) => void }} */
export function useCurrency() {
  return useContext(CurrencyContext);
}

/** Format an INR amount in `currency`; invalid amounts fall back to an empty string. */
function formatInCurrency(amountINR, currency, decimals) {
  try {
    return formatPrice(convertPrice(amountINR, currency), currency, CURRENCIES, decimals);
  } catch {
    return "";
  }
}

/**
 * Price in the selected currency with a 150ms crossfade on change (Req 9.7, 10.2).
 * Keeps `data-price-inr` with the source INR amount on the element.
 * @param {object} props
 * @param {number} props.amountINR amount in whole INR (alias: `inr`)
 * @param {number} [props.inr] alias of amountINR (design 5.4 naming)
 * @param {number} [props.decimals] fraction digits; default the currency's `decimals`
 * @param {string} [props.className] e.g. "price" for the gradient price style
 */
export function Price({ amountINR, inr, decimals, className }) {
  const amount = amountINR ?? inr;
  const { currency } = useCurrency();

  // Animate only after a change, never on the first (hydrating) render.
  const [shown, setShown] = useState(currency);
  const [animate, setAnimate] = useState(false);
  if (shown !== currency) {
    setShown(currency);
    setAnimate(true);
  }

  return (
    <span className={className} data-price-inr={amount}>
      <span key={currency} className={animate ? styles.fade : undefined}>
        {formatInCurrency(amount, currency, decimals)}
      </span>
    </span>
  );
}

function optionLabel(code) {
  const symbol = CURRENCIES[code].symbol.trim();
  return symbol && symbol !== code ? `${code} (${symbol})` : code;
}

/**
 * Currency control bound to the shared context (Req 10.1, 10.3).
 * @param {object} props
 * @param {"select" | "segmented"} [props.variant="select"] header select or segmented radios
 * @param {string} [props.className] extra classes on the wrapper
 */
export function CurrencySwitcher({ variant = "select", className }) {
  const { currency, setCurrency } = useCurrency();
  const groupName = `currency-${useId()}`;

  if (variant === "segmented") {
    return (
      <div role="radiogroup" aria-label="Currency" className={className ? `${seg.group} ${className}` : seg.group}>
        {CURRENCY_CODES.map((code) => (
          <label key={code} className={seg.option}>
            <input
              type="radio"
              name={groupName}
              value={code}
              className={seg.input}
              checked={currency === code}
              onChange={() => setCurrency(code)}
            />
            <span className={seg.segment}>{optionLabel(code)}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <select
      aria-label="Currency"
      className={`${field.select} ${styles.select}${className ? ` ${className}` : ""}`}
      value={currency}
      onChange={(event) => setCurrency(event.target.value)}
    >
      {CURRENCY_CODES.map((code) => (
        <option key={code} value={code}>
          {optionLabel(code)}
        </option>
      ))}
    </select>
  );
}

export default CurrencyProvider;
