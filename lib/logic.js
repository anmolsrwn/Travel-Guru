// Logic_Module: pure, deterministic functions.
// No DOM, storage, clock or randomness access; inputs are never mutated.
// Loads in Node without any browser globals and without console output.
// The current date/time and random numbers are always passed in as arguments.
import {
  BUDGETS,
  BUSINESS,
  CALLBACK_SLOTS,
  CATEGORIES,
  CURRENCIES,
  DURATIONS,
  FORBIDDEN_CLAIMS,
  FOREX_CONFIG,
  FOREX_CURRENCIES,
  HOTEL_CATEGORIES,
  IMAGE_HOSTS,
  LIMITS,
  MEAL_PLANS,
  POLICIES,
  QUOTE_SERVICE_OPTIONS,
  TIER_IDS,
  TRIP_TYPES,
} from "./data.js";

// ---------------------------------------------------------------------------
// Currency (amounts in INR)
// ---------------------------------------------------------------------------

/** Look up a currency config or throw RangeError for unknown codes. */
function currencyOf(code, currencies) {
  if (typeof code !== "string" || !currencies || !Object.hasOwn(currencies, code)) {
    throw new RangeError(`Unknown currency code: ${String(code)}`);
  }
  return currencies[code];
}

function assertAmount(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
    throw new RangeError(`Amount must be a non-negative finite number, got ${String(amount)}`);
  }
}

/** Round a non-negative number to 2 decimals, halves up (float noise removed first). */
function roundHalfUp2(x) {
  const scaled = Number((x * 100).toPrecision(15));
  return Math.floor(scaled + 0.5) / 100;
}

/**
 * Convert an INR amount into `currencyCode` using the static rate.
 * @returns {number} rounded to 2 decimals, halves up
 */
export function convertPrice(amountINR, currencyCode, currencies = CURRENCIES) {
  const cur = currencyOf(currencyCode, currencies);
  assertAmount(amountINR);
  return roundHalfUp2(amountINR * cur.rate);
}

/**
 * Format an amount already in `currencyCode`: symbol + Intl grouping in the
 * currency's locale (en-IN gives Indian grouping, e.g. "₹3,90,000").
 */
export function formatPrice(amount, currencyCode, currencies = CURRENCIES, decimals) {
  const cur = currencyOf(currencyCode, currencies);
  assertAmount(amount);
  const digits = Number.isInteger(decimals) && decimals >= 0 ? decimals : cur.decimals;
  const formatted = new Intl.NumberFormat(cur.locale, {
    useGrouping: true,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
  return `${cur.symbol}${formatted}`;
}

// ---------------------------------------------------------------------------
// Forex (amounts in INR unless stated; CURRENCIES[x].rate = units of x per 1 INR)
// ---------------------------------------------------------------------------

const FOREX_ERR_BASE = "Base currency must be INR";
const FOREX_ERR_CURRENCY = "Unsupported currency";
const FOREX_ERR_RANGE = "Amount outside allowed range";

/** Mid-market rate (units of `code` per 1 INR) for a foreign currency, or throws "Unsupported currency". */
function forexMidRate(code, currencies) {
  const ok =
    typeof code === "string" &&
    code !== "INR" &&
    currencies !== null &&
    typeof currencies === "object" &&
    Object.hasOwn(currencies, code) &&
    Number.isFinite(currencies[code]?.rate) &&
    currencies[code].rate > 0;
  if (!ok) throw new Error(FOREX_ERR_CURRENCY);
  return currencies[code].rate;
}

/** Strip float noise so exact-limit amounts (e.g. 60 USD at rate 0.012) land on the limit. */
const cleanNumber = (x) => Number(x.toPrecision(12));

/** True iff `inr` lies within [minTransactionINR, maxTransactionINR] (inclusive). */
function inForexRange(inr, forexConfig) {
  return (
    Number.isFinite(inr) &&
    inr >= forexConfig.minTransactionINR &&
    inr <= forexConfig.maxTransactionINR
  );
}

/**
 * Rate for a customer buying `targetCurrency` with INR: base * (1 + buyMargin%).
 * `base` is CURRENCIES[targetCurrency].rate (units of foreign currency per 1 INR).
 * @param {string} baseCurrency Must be "INR"
 * @param {string} targetCurrency Foreign currency to buy
 * @param {object} currencies CURRENCIES object
 * @param {object} forexConfig FOREX_CONFIG object
 * @returns {number}
 * @throws {Error} "Base currency must be INR" / "Unsupported currency"
 */
export function calculateForexBuyRate(baseCurrency, targetCurrency, currencies, forexConfig) {
  if (baseCurrency !== "INR") throw new Error(FOREX_ERR_BASE);
  const base = forexMidRate(targetCurrency, currencies);
  return base * (1 + forexConfig.buyMarginPercent / 100);
}

/**
 * Rate for a customer selling `targetCurrency` for INR: base * (1 - sellMargin%).
 * @param {string} baseCurrency Must be "INR"
 * @param {string} targetCurrency Foreign currency to sell
 * @param {object} currencies CURRENCIES object
 * @param {object} forexConfig FOREX_CONFIG object
 * @returns {number}
 * @throws {Error} "Base currency must be INR" / "Unsupported currency"
 */
export function calculateForexSellRate(baseCurrency, targetCurrency, currencies, forexConfig) {
  if (baseCurrency !== "INR") throw new Error(FOREX_ERR_BASE);
  const base = forexMidRate(targetCurrency, currencies);
  return base * (1 - forexConfig.sellMarginPercent / 100);
}

/**
 * Build a quote without any range check (shared by the public quote functions).
 * Amounts use the customer-unfavourable direction:
 *   buy:  foreign = inr * base / (1 + buy%)      sell: inr = foreign / base * (1 - sell%)
 * `rate` reports the buy/sell rate function value.
 */
function buildForexQuote(direction, sourceCurrency, targetCurrency, amount, currencies, forexConfig) {
  if (direction !== "buy" && direction !== "sell") throw new Error("Invalid direction");
  const buy = direction === "buy";
  // The INR side must be INR (checked by the rate functions); the other side is the foreign currency.
  const baseSide = buy ? sourceCurrency : targetCurrency;
  const foreign = buy ? targetCurrency : sourceCurrency;
  const rate = buy
    ? calculateForexBuyRate(baseSide, foreign, currencies, forexConfig)
    : calculateForexSellRate(baseSide, foreign, currencies, forexConfig);
  const base = currencies[foreign].rate;
  const feePct = forexConfig.serviceFeePercent / 100;

  let rawTarget;
  let rawFee;
  if (buy) {
    rawTarget = (amount * base) / (1 + forexConfig.buyMarginPercent / 100);
    rawFee = amount * feePct;
  } else {
    rawTarget = (amount / base) * (1 - forexConfig.sellMarginPercent / 100);
    rawFee = rawTarget * feePct;
  }

  const sourceAmount = roundHalfUp2(amount);
  const targetAmount = roundHalfUp2(rawTarget);
  const serviceFee = roundHalfUp2(rawFee);
  const totalINR = roundHalfUp2(buy ? sourceAmount + serviceFee : targetAmount - serviceFee);
  return { direction, sourceCurrency, targetCurrency, sourceAmount, targetAmount, rate, serviceFee, totalINR };
}

/**
 * Complete forex quote. Buy: INR -> foreign. Sell: foreign -> INR.
 * Money fields are rounded to 2 decimals (half up); `rate` is the unrounded buy/sell rate.
 * @param {"buy"|"sell"} direction
 * @param {string} sourceCurrency "INR" for buy, foreign code for sell
 * @param {string} targetCurrency foreign code for buy, "INR" for sell
 * @param {number} amount Amount in the source currency
 * @param {object} currencies CURRENCIES object
 * @param {object} forexConfig FOREX_CONFIG object
 * @returns {{direction: string, sourceCurrency: string, targetCurrency: string, sourceAmount: number,
 *   targetAmount: number, rate: number, serviceFee: number, totalINR: number}}
 * @throws {Error} "Invalid direction", "Base currency must be INR", "Unsupported currency",
 *   "Amount outside allowed range"; RangeError for a non-numeric amount
 */
export function calculateForexQuote(direction, sourceCurrency, targetCurrency, amount, currencies, forexConfig) {
  if (direction !== "buy" && direction !== "sell") throw new Error("Invalid direction");
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    throw new RangeError(`Amount must be a number, got ${String(amount)}`);
  }
  const buy = direction === "buy";
  const foreign = buy ? targetCurrency : sourceCurrency;
  if ((buy ? sourceCurrency : targetCurrency) !== "INR") throw new Error(FOREX_ERR_BASE);
  const base = forexMidRate(foreign, currencies);
  // INR equivalent: the INR amount itself for buy, mid-market conversion for sell.
  const inr = buy ? amount : cleanNumber(amount / base);
  if (!inForexRange(inr, forexConfig)) throw new Error(FOREX_ERR_RANGE);
  return buildForexQuote(direction, sourceCurrency, targetCurrency, amount, currencies, forexConfig);
}

/**
 * True iff the mid-market INR equivalent (foreignAmount / base) is within
 * [minTransactionINR, maxTransactionINR], inclusive. Never throws.
 * @param {string} currency Foreign currency code
 * @param {number} foreignAmount
 * @param {object} currencies CURRENCIES object
 * @param {object} forexConfig FOREX_CONFIG object
 * @returns {boolean}
 */
export function isForexAmountInRange(currency, foreignAmount, currencies, forexConfig) {
  try {
    if (typeof foreignAmount !== "number" || !Number.isFinite(foreignAmount) || foreignAmount <= 0) return false;
    if (!forexConfig || typeof forexConfig !== "object") return false;
    const base = forexMidRate(currency, currencies);
    return inForexRange(cleanNumber(foreignAmount / base), forexConfig);
  } catch {
    return false;
  }
}

/**
 * Quote for a foreign-currency amount (what the UI, form and API carry).
 * Buy: derives the INR to pay so the customer receives `foreignAmount`
 * (inr = foreign * (1 + buy%) / base). Sell: `foreignAmount` is the source as-is.
 * The range check uses the mid-market INR equivalent, so an amount exactly at a limit is accepted.
 * @param {"buy"|"sell"} direction
 * @param {string} currency Foreign currency code
 * @param {number} foreignAmount
 * @param {object} currencies CURRENCIES object
 * @param {object} forexConfig FOREX_CONFIG object
 * @returns {ReturnType<typeof calculateForexQuote>}
 * @throws {Error} "Invalid direction", "Unsupported currency", "Amount outside allowed range"
 */
export function calculateForexQuoteForForeignAmount(direction, currency, foreignAmount, currencies, forexConfig) {
  if (direction !== "buy" && direction !== "sell") throw new Error("Invalid direction");
  const base = forexMidRate(currency, currencies);
  if (!isForexAmountInRange(currency, foreignAmount, currencies, forexConfig)) throw new Error(FOREX_ERR_RANGE);
  if (direction === "sell") {
    return buildForexQuote("sell", currency, "INR", foreignAmount, currencies, forexConfig);
  }
  const inr = (foreignAmount * (1 + forexConfig.buyMarginPercent / 100)) / base;
  return buildForexQuote("buy", "INR", currency, inr, currencies, forexConfig);
}

/**
 * Quote for an INR amount (the "enter amount in INR" mode of the forex calculator).
 * Buy: `inrAmount` is the INR the customer pays before the service fee.
 * Sell: `inrAmount` is the INR the customer receives before the service fee, so the foreign amount
 * to sell is inrAmount * base / (1 - sell%). Range check uses the same limits as the foreign mode.
 * @param {"buy"|"sell"} direction
 * @param {string} currency Foreign currency code
 * @param {number} inrAmount
 * @param {object} currencies CURRENCIES object
 * @param {object} forexConfig FOREX_CONFIG object
 * @returns {ReturnType<typeof calculateForexQuote>}
 * @throws {Error} "Invalid direction", "Unsupported currency", "Amount outside allowed range"
 */
export function calculateForexQuoteForInrAmount(direction, currency, inrAmount, currencies, forexConfig) {
  if (direction !== "buy" && direction !== "sell") throw new Error("Invalid direction");
  if (typeof inrAmount !== "number" || !Number.isFinite(inrAmount) || inrAmount <= 0) {
    throw new Error(FOREX_ERR_RANGE);
  }
  if (direction === "buy") {
    return calculateForexQuote("buy", "INR", currency, inrAmount, currencies, forexConfig);
  }
  const base = forexMidRate(currency, currencies);
  const foreignAmount = (inrAmount * base) / (1 - forexConfig.sellMarginPercent / 100);
  return calculateForexQuoteForForeignAmount("sell", currency, foreignAmount, currencies, forexConfig);
}

const isFiniteNum = (v) => typeof v === "number" && Number.isFinite(v);

/**
 * Validate a forex configuration object. Never throws.
 * Error keys: `margins`, `transactionLimits`, `serviceFee`.
 * @param {object} config FOREX_CONFIG-shaped object
 * @returns {{valid: boolean, errors: Record<string, string>}}
 */
export function validateForexConfig(config) {
  const errors = {};
  const c = config && typeof config === "object" ? config : {};
  const { buyMarginPercent, sellMarginPercent, minTransactionINR, maxTransactionINR, serviceFeePercent } = c;

  const marginOk = (m) => isFiniteNum(m) && m >= 0 && m <= 20;
  if (!marginOk(buyMarginPercent) || !marginOk(sellMarginPercent)) {
    errors.margins = "Margins must be numbers between 0 and 20";
  }
  if (
    !isFiniteNum(minTransactionINR) ||
    !isFiniteNum(maxTransactionINR) ||
    minTransactionINR < 1000 ||
    minTransactionINR >= maxTransactionINR
  ) {
    errors.transactionLimits = "Minimum must be at least 1000 and less than the maximum";
  }
  if (!isFiniteNum(serviceFeePercent) || serviceFeePercent < 0) {
    errors.serviceFee = "Service fee must be a non-negative number";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Validate a forex quote request `{ direction, currency, amount }`. Never throws.
 * Error keys: `direction`, `currency`, `amount`. No range check here; see isForexAmountInRange.
 * @param {object} request
 * @param {object} forexConfig FOREX_CONFIG object (reserved; range is checked elsewhere)
 * @param {string[]} forexCurrencies FOREX_CURRENCIES array
 * @returns {{valid: boolean, errors: Record<string, string>}}
 */
export function validateForexQuoteRequest(request, forexConfig, forexCurrencies) {
  const errors = {};
  const r = request && typeof request === "object" ? request : {};

  if (r.direction !== "buy" && r.direction !== "sell") {
    errors.direction = "Must be 'buy' or 'sell'";
  }
  if (typeof r.currency !== "string" || !Array.isArray(forexCurrencies) || !forexCurrencies.includes(r.currency)) {
    errors.currency = "Unsupported currency";
  }
  if (!isFiniteNum(r.amount) || r.amount <= 0) {
    errors.amount = "Must be a positive number";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

/** Packages tagged with `categoryId` (new array, input order); "all" returns a copy. */
export function filterPackages(packages, categoryId) {
  if (!Array.isArray(packages)) return [];
  if (categoryId === "all") return packages.slice();
  return packages.filter((p) => Array.isArray(p?.categories) && p.categories.includes(categoryId));
}

/**
 * Returns packages whose seasons array includes the given month number.
 * Packages with a missing, non-array, or empty seasons array are excluded.
 *
 * @param {Object[]} packages - Array of package objects
 * @param {number} month      - Integer month 1–12
 * @returns {Object[]}        - New array, input order preserved, never throws
 */
export function filterPackagesBySeason(packages, month) {
  if (!Array.isArray(packages)) return [];
  if (!Number.isInteger(month) || month < 1 || month > 12) return [];
  return packages.filter(
    (pkg) =>
      pkg != null &&
      Array.isArray(pkg.seasons) &&
      pkg.seasons.length > 0 &&
      pkg.seasons.includes(month)
  );
}

/** Maximum number of cards shown in the home page season rail. */
export const RAIL_MAX_CARDS = 3;

/**
 * Selects the packages shown in the home page season rail: in-season for the
 * given month, input order preserved, capped at RAIL_MAX_CARDS.
 *
 * @param {Object[]} packages
 * @param {number} month - Integer month 1–12
 * @returns {Object[]}
 */
export function selectRailPackages(packages, month) {
  return filterPackagesBySeason(packages, month).slice(0, RAIL_MAX_CARDS);
}

/**
 * Returns true when a package is ideal for the given month.
 *
 * @param {Object} pkg   - A package object (any value — never throws)
 * @param {number} month - Integer month 1–12, or null/undefined (returns false)
 * @returns {boolean}
 */
export function isPackageInSeason(pkg, month) {
  if (pkg == null || typeof pkg !== 'object') return false;
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  return Array.isArray(pkg.seasons) && pkg.seasons.includes(month);
}

/** Minimum adult tier price of a package. */
export function fromPriceINR(pkg) {
  return Math.min(...pkg.tiers.map((t) => t.adultPriceINR));
}

/** Tier with `tierId`, else the cheapest tier (first one on ties). */
export function getTier(pkg, tierId) {
  const tiers = pkg.tiers;
  const match = tiers.find((t) => t.id === tierId);
  if (match) return match;
  return tiers.reduce((min, t) => (t.adultPriceINR < min.adultPriceINR ? t : min), tiers[0]);
}

/** Package inclusions override, else region-based defaults from POLICIES. */
export function packageInclusions(pkg, policies = POLICIES) {
  if (pkg.inclusions != null) return pkg.inclusions.slice();
  const list = pkg.region === "domestic" ? policies.inclusionsDomestic : policies.inclusions;
  return list.slice();
}

// ---------------------------------------------------------------------------
// Destinations
// ---------------------------------------------------------------------------

/** Destinations whose region equals `region` (new array, input order). */
export function destinationsByRegion(destinations, region) {
  if (!Array.isArray(destinations)) return [];
  return destinations.filter((d) => d?.region === region);
}

const DESTINATION_REGIONS = ["international", "domestic"];

/**
 * Region to show in the destinations toggle. Returns `requested` if it has destinations,
 * else `active` if it has destinations, else the first region with destinations, else null.
 */
export function selectRegion(destinations, active, requested) {
  const available = DESTINATION_REGIONS.filter((r) => destinationsByRegion(destinations, r).length > 0);
  if (requested != null && available.includes(requested)) return requested;
  if (active != null && available.includes(active)) return active;
  return available[0] ?? null;
}

// ---------------------------------------------------------------------------
// Dates (ISO "YYYY-MM-DD" calendar days; pure integer arithmetic, no time zones)
// ---------------------------------------------------------------------------

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const daysInMonth = (y, m) => [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];

/** Parse a strict ISO date; returns {y,m,d} or null for malformed / non-existent dates. */
function parseISO(s) {
  if (typeof s !== "string") return null;
  const m = ISO_RE.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) return null;
  return { y, m: mo, d };
}

// Days since 1970-01-01 (proleptic Gregorian), H. Hinnant's days_from_civil.
function toDayNumber({ y, m, d }) {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

function fromDayNumber(z) {
  const zz = z + 719468;
  const era = Math.floor(zz / 146097);
  const doe = zz - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  const y = yoe + era * 400 + (m <= 2 ? 1 : 0);
  return { y, m, d };
}

function requireISO(s, name) {
  const p = parseISO(s);
  if (!p) throw new RangeError(`${name} must be a valid YYYY-MM-DD date, got ${String(s)}`);
  return p;
}

const pad = (n, w) => String(n).padStart(w, "0");

/** ISO date `n` calendar days after `isoDate` (before for negative n). */
export function addDays(isoDate, n) {
  const p = requireISO(isoDate, "isoDate");
  if (!Number.isInteger(n)) throw new RangeError(`n must be an integer, got ${String(n)}`);
  const { y, m, d } = fromDayNumber(toDayNumber(p) + n);
  if (y < 0 || y > 9999) throw new RangeError("Resulting date is outside years 0000-9999");
  return `${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}`;
}

/** Integer calendar days from `fromISO` to `toISO` (negative when toISO is earlier). */
export function daysBetween(fromISO, toISO) {
  return toDayNumber(requireISO(toISO, "toISO")) - toDayNumber(requireISO(fromISO, "fromISO"));
}

/** Earliest allowed departure: the day after `todayISO`. */
export function minDepartureDate(todayISO) {
  return addDays(todayISO, 1);
}

/** True iff both are well-formed dates and `dateStr` >= `minDateStr`; never throws. */
export function isDateOnOrAfter(dateStr, minDateStr) {
  const a = parseISO(dateStr);
  const b = parseISO(minDateStr);
  if (!a || !b) return false;
  return toDayNumber(a) >= toDayNumber(b);
}

// ---------------------------------------------------------------------------
// Payment & cancellation policy
// ---------------------------------------------------------------------------

/** Truncate toward zero and clamp into [min, max]; non-numeric / non-finite → min. */
export function clampCount(n, min, max) {
  if (typeof n !== "number" || !Number.isFinite(n)) return min;
  const t = Math.trunc(n) + 0; // +0 normalises -0
  if (t < min) return min;
  if (t > max) return max;
  return t;
}

/**
 * Land package total for a tier selection. Extras are never added.
 * @param {{tier: object, adults: any, children: any}} selection
 */
export function computeLandTotal(selection) {
  const { tier } = selection;
  const [aMin, aMax] = LIMITS.adults;
  const [cMin, cMax] = LIMITS.children;
  const childPrice = tier.childPriceINR ?? null;
  const adults = clampCount(selection.adults, aMin, aMax);
  const children = childPrice === null ? 0 : clampCount(selection.children, cMin, cMax);
  const adultsSubtotal = adults * tier.adultPriceINR;
  const childrenSubtotal = childPrice === null ? 0 : children * childPrice;
  return {
    tierId: tier.id,
    adults,
    children,
    adultPriceINR: tier.adultPriceINR,
    childPriceINR: childPrice,
    adultsSubtotal,
    childrenSubtotal,
    total: adultsSubtotal + childrenSubtotal,
    currency: "INR",
  };
}

/**
 * Advance/balance per the payment policy. Rule order:
 * within window (< fullPaymentWithinDays) → 100%; below threshold pp → 100%;
 * otherwise advanceRate (rounded up to a whole rupee), balance due
 * balanceDueDaysBefore days before departure.
 */
export function computeAdvance(totalINR, perPersonINR, bookingDate, departureDate, policy = BUSINESS.paymentPolicy) {
  const daysUntilDeparture = daysBetween(bookingDate, departureDate);
  const full = (rule) => ({
    advanceRate: 1,
    advance: totalINR,
    balance: 0,
    balanceDueDate: null,
    rule,
    daysUntilDeparture,
  });
  if (daysUntilDeparture < policy.fullPaymentWithinDays) return full("within-window");
  if (perPersonINR < policy.thresholdPerPersonINR) return full("below-threshold");
  const advance = Math.ceil(Number((totalINR * policy.advanceRate).toPrecision(12)));
  return {
    advanceRate: policy.advanceRate,
    advance,
    balance: totalINR - advance,
    balanceDueDate: addDays(departureDate, -policy.balanceDueDaysBefore),
    rule: "standard",
    daysUntilDeparture,
  };
}

/** LandTotal fields merged with the AdvanceResult for the selected tier. */
export function computeBookingBreakdown(selection, departureDate, bookingDate, policy = BUSINESS.paymentPolicy) {
  const land = computeLandTotal(selection);
  return {
    ...land,
    ...computeAdvance(land.total, selection.tier.adultPriceINR, bookingDate, departureDate, policy),
  };
}

/** Cancellation charge fraction for `daysPrior` days before departure. */
export function cancellationCharge(daysPrior, table = POLICIES.cancellation.table) {
  if (typeof daysPrior !== "number" || !Number.isInteger(daysPrior) || daysPrior < 0) {
    throw new RangeError(`daysPrior must be a non-negative integer, got ${String(daysPrior)}`);
  }
  const band = table.find((b) => daysPrior >= b.minDays && (b.maxDays === null || daysPrior <= b.maxDays));
  if (!band) throw new RangeError(`No cancellation band covers ${daysPrior} days`);
  return band.rate;
}

// ---------------------------------------------------------------------------
// IDs (the random `n` is drawn by the caller, e.g. crypto.randomInt)
// ---------------------------------------------------------------------------

/** "QT-YYYY-NNNN": year as given, last segment = non-negative n mod 10000, zero-padded. */
export function generateTicketId(year, n) {
  return `QT-${year}-${String(((n % 10000) + 10000) % 10000).padStart(4, "0")}`;
}

/** True iff `id` is a string matching ^QT-\d{4}-\d{4}$; never throws. */
export function isValidTicketId(id) {
  return typeof id === "string" && /^QT-\d{4}-\d{4}$/.test(id);
}

// 32 readable characters: A–Z without I and O, digits 2–9 (no 0, 1).
const BOOKING_REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const BOOKING_REF_SPACE = 2 ** 30; // 32^6

/**
 * "BK-XXXXXX" derived deterministically from an integer n ∈ [0, 2^32).
 * The low 30 bits are XOR-folded with the top 2 bits, then written as
 * 6 base-32 digits over BOOKING_REF_ALPHABET.
 */
export function generateBookingRef(n) {
  if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) {
    throw new RangeError(`n must be an integer in [0, 4294967295], got ${String(n)}`);
  }
  let v = (n % BOOKING_REF_SPACE) ^ Math.floor(n / BOOKING_REF_SPACE);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code = BOOKING_REF_ALPHABET[v % 32] + code;
    v = Math.floor(v / 32);
  }
  return `BK-${code}`;
}

// ---------------------------------------------------------------------------
// Call-back
// ---------------------------------------------------------------------------

/** New Date exactly `hours` hours after `now`; independent of `slotId`; `now` untouched. */
export function computeCallbackDeadline(now, slotId, hours = BUSINESS.callbackHours) {
  return new Date(now.getTime() + hours * 3_600_000);
}

// ---------------------------------------------------------------------------
// Validation (pure, never throws; `valid` ⟺ `errors` is empty)
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?\d{8,15}$/;
const SERVICES_MAX = QUOTE_SERVICE_OPTIONS.length; // one per entry, so "select all" is accepted

/** "Amount must be between ₹5,000 and ₹5,00,000 equivalent" (built from FOREX_CONFIG). */
const forexRangeMessage = () =>
  `Amount must be between ${formatPrice(FOREX_CONFIG.minTransactionINR, "INR")} and ${formatPrice(
    FOREX_CONFIG.maxTransactionINR,
    "INR",
  )} equivalent`;

const MSG = {
  forexDirection: "Select buy or sell",
  forexCurrency: "Select a currency",
  forexAmount: "Enter a valid amount",
  services: "Select at least one service",
  servicesMax: `Select at most ${SERVICES_MAX} services`,
  fullName: "Enter your full name",
  leadName: "Enter the lead guest's full name",
  phone: "Enter a valid phone / WhatsApp number",
  email: "Enter a valid email",
  adults: "1 to 12 adults",
  children: "0 to 8 children",
  childrenNoPrice: "This tier does not accept children",
  childAges: "Max 100 characters",
  departureCity: "Max 80 characters",
  destinations: "Where would you like to go?",
  destinationsMax: "Max 200 characters",
  date: "Choose a future date",
  choice: "Invalid choice",
  notes: "Max 1000 characters",
  tierId: "Choose a hotel tier",
  agreeTerms: "Please accept the Terms & Cancellation Policy",
};

/** True iff `s` is a string matching ^[^\s@]+@[^\s@]+\.[^\s@]{2,}$; never throws. */
export function validateEmail(s) {
  return typeof s === "string" && EMAIL_RE.test(s);
}

/** True iff `s` is a string that, without spaces, dashes and parentheses, is an optional "+" and 8–15 digits. */
export function validatePhone(s) {
  return typeof s === "string" && PHONE_RE.test(s.replace(/[ \-()]/g, ""));
}

const isObject = (v) => v !== null && typeof v === "object";
const inRange = (n, [min, max]) => Number.isInteger(n) && n >= min && n <= max;

/** Trimmed length of a string within [min, max]. */
const trimmedLenIn = (s, [min, max]) => {
  if (typeof s !== "string") return false;
  const len = s.trim().length;
  return len >= min && len <= max;
};

/** String of at most `max` raw characters. */
const strMax = (s, max) => typeof s === "string" && s.length <= max;

/** Read `key` from `data`, substituting `fallback` only when the field is missing (undefined). */
const get = (data, key, fallback) => (data[key] === undefined ? fallback : data[key]);

/** Earliest allowed departure, or null when `todayISO` is malformed (keeps the validators total). */
function safeMinDeparture(todayISO) {
  try {
    return minDepartureDate(todayISO);
  } catch {
    return null;
  }
}

const isFutureDate = (date, minDate) => minDate !== null && isDateOnOrAfter(date, minDate);

const validEmailField = (s) => strMax(s, LIMITS.emailMax) && validateEmail(s);
const validPhoneField = (s) => strMax(s, LIMITS.phoneMax) && validatePhone(s);

const QUOTE_OPTION_FIELDS = {
  duration: DURATIONS,
  tripType: TRIP_TYPES,
  hotelCategory: HOTEL_CATEGORIES,
  mealPlan: MEAL_PLANS,
  budget: BUDGETS,
  callbackSlot: CALLBACK_SLOTS.map((s) => s.id),
};

/**
 * Validate the quotation form (design 7.11).
 * Missing fields default to: strings "", services [], adults 2, children 0,
 * departureCity BUSINESS.originCity.name. Non-string values in string fields are errors.
 * @param {object} data
 * @param {string} todayISO
 * @param {{mode?: "submit" | "whatsapp"}} [opts]
 * @returns {{valid: boolean, errors: Record<string, string>}}
 */
export function validateQuoteForm(data, todayISO, opts = { mode: "submit" }) {
  const d = isObject(data) ? data : {};
  const whatsapp = isObject(opts) && opts.mode === "whatsapp";
  const errors = {};

  const services = get(d, "services", []);
  if (!Array.isArray(services) || services.length === 0 || !services.every((s) => QUOTE_SERVICE_OPTIONS.includes(s))) {
    errors.services = MSG.services;
  } else if (services.length > SERVICES_MAX) {
    errors.services = MSG.servicesMax;
  }

  // Forex details are validated only when "Forex" is selected (otherwise `forexDetails` is ignored).
  // They are required in BOTH modes: the "whatsapp" leniency applies to optional contact/trip fields
  // (email, date, destinations), whereas direction/currency/amount are the substance of a forex request.
  if (Array.isArray(services) && services.includes("Forex")) {
    const fx = d.forexDetails;
    if (!isObject(fx) || Array.isArray(fx)) {
      errors.forexDirection = MSG.forexDirection;
      errors.forexCurrency = MSG.forexCurrency;
      errors.forexAmount = MSG.forexAmount;
    } else {
      const res = validateForexQuoteRequest(fx, FOREX_CONFIG, FOREX_CURRENCIES);
      if (res.errors.direction) errors.forexDirection = MSG.forexDirection;
      if (res.errors.currency) errors.forexCurrency = MSG.forexCurrency;
      if (res.errors.amount) {
        errors.forexAmount = MSG.forexAmount;
      } else if (!res.errors.currency && !isForexAmountInRange(fx.currency, fx.amount, CURRENCIES, FOREX_CONFIG)) {
        errors.forexAmount = forexRangeMessage();
      }
    }
  }

  if (!trimmedLenIn(get(d, "fullName", ""), LIMITS.fullName)) errors.fullName = MSG.fullName;
  if (!validPhoneField(get(d, "phone", ""))) errors.phone = MSG.phone;
  if (!inRange(get(d, "adults", 2), LIMITS.adults)) errors.adults = MSG.adults;
  if (!inRange(get(d, "children", 0), LIMITS.children)) errors.children = MSG.children;
  if (!strMax(get(d, "childAges", ""), LIMITS.childAgesMaxLength)) errors.childAges = MSG.childAges;
  if (!strMax(get(d, "departureCity", BUSINESS.originCity.name), LIMITS.departureCityMax)) {
    errors.departureCity = MSG.departureCity;
  }

  const email = get(d, "email", "");
  const destinations = get(d, "destinations", "");
  const departureDate = get(d, "departureDate", "");
  const minDate = safeMinDeparture(todayISO);

  if (typeof destinations !== "string") {
    errors.destinations = MSG.destinations;
  } else if (destinations.length > LIMITS.destinationsMax) {
    errors.destinations = MSG.destinationsMax;
  } else if (!whatsapp && destinations.trim() === "") {
    errors.destinations = MSG.destinations;
  }

  if (whatsapp) {
    // Lenient: empty is fine, but anything provided must be valid.
    if (typeof email !== "string" || (email.trim() !== "" && !validEmailField(email))) errors.email = MSG.email;
    if (typeof departureDate !== "string" || (departureDate !== "" && !isFutureDate(departureDate, minDate))) {
      errors.departureDate = MSG.date;
    }
  } else {
    if (!validEmailField(email)) errors.email = MSG.email;
    if (!isFutureDate(departureDate, minDate)) errors.departureDate = MSG.date;
  }

  for (const [field, options] of Object.entries(QUOTE_OPTION_FIELDS)) {
    const v = get(d, field, "");
    if (typeof v !== "string" || (v !== "" && !options.includes(v))) errors[field] = MSG.choice;
  }

  if (!strMax(get(d, "notes", ""), LIMITS.notesMax)) errors.notes = MSG.notes;

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Validate a booking request (design 7.12). No card checks; extra keys are ignored.
 * @param {object} data {tierId, adults, children, travelDate, leadName, email, phone, agreeTerms}
 * @param {string} todayISO
 * @param {object} pkg Package with `tiers`
 * @returns {{valid: boolean, errors: Record<string, string>}}
 */
export function validateCheckout(data, todayISO, pkg) {
  const d = isObject(data) ? data : {};
  const errors = {};

  const tiers = isObject(pkg) && Array.isArray(pkg.tiers) ? pkg.tiers : [];
  const tier = typeof d.tierId === "string" ? tiers.find((t) => isObject(t) && t.id === d.tierId) : undefined;
  if (!tier) errors.tierId = MSG.tierId;

  if (!inRange(d.adults, LIMITS.adults)) errors.adults = MSG.adults;
  if (!inRange(d.children, LIMITS.children)) {
    errors.children = MSG.children;
  } else if (tier && tier.childPriceINR == null && d.children > 0) {
    errors.children = MSG.childrenNoPrice;
  }

  if (!isFutureDate(d.travelDate, safeMinDeparture(todayISO))) errors.travelDate = MSG.date;
  if (!trimmedLenIn(d.leadName, LIMITS.fullName)) errors.leadName = MSG.leadName;
  if (!validEmailField(d.email)) errors.email = MSG.email;
  if (!validPhoneField(d.phone)) errors.phone = MSG.phone;
  if (d.agreeTerms !== true) errors.agreeTerms = MSG.agreeTerms;

  return { valid: Object.keys(errors).length === 0, errors };
}

// ---------------------------------------------------------------------------
// WhatsApp (design 7.13–7.15)
// ---------------------------------------------------------------------------

/** "*Label:* value" for a non-empty trimmed value, else null. */
const waLine = (label, v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s ? `*${label}:* ${s}` : null;
};

/** CALLBACK_SLOTS label for a slot id; unknown non-empty ids are shown as given. */
function labelForSlot(slotId) {
  const slot = CALLBACK_SLOTS.find((s) => s.id === slotId);
  return slot ? slot.label : slotId;
}

/**
 * WhatsApp instant-quote message (design 7.13). Fields in fixed order with bold
 * labels; empty fields (and Children when 0) are omitted.
 * @param {object} d quote form data
 * @param {{brandName: string}} b business config
 * @returns {string}
 */
export function composeQuoteWhatsAppMessage(d, b) {
  const services = Array.isArray(d.services) ? d.services : [];
  const ages = String(d.childAges ?? "").trim();
  const kids = d.children > 0 ? (ages ? `${d.children} (ages: ${ages})` : `${d.children}`) : null;
  return [
    `Hello ${b.brandName}! I'd like an instant quote.`,
    "",
    waLine("Services", services.join(", ")),
    waLine("From", d.departureCity),
    waLine("To", d.destinations),
    waLine("Departure", d.departureDate),
    waLine("Duration", d.duration),
    waLine("Trip type", d.tripType),
    waLine("Adults", d.adults),
    waLine("Children", kids),
    waLine("Hotel category", d.hotelCategory),
    waLine("Meal plan", d.mealPlan),
    waLine("Budget", d.budget),
    waLine("Name", d.fullName),
    waLine("Phone", d.phone),
    waLine("Email", d.email),
    waLine("Call-back slot", labelForSlot(d.callbackSlot)),
    waLine("Notes", d.notes),
  ]
    .filter((x) => x !== null)
    .join("\n");
}

const BOOKING_POLICY_LINE = "Advance as per Travel Guru payment policy";
const BOOKING_LAST_LINE = "Flights & visa to be quoted separately.";

/**
 * WhatsApp booking message for Checkout Mode A (design 7.14).
 * `breakdown` is a Booking_Breakdown (has `advance`/`rule`) when a travel date
 * is provided, otherwise a Land_Total. Amounts are always INR; an indicative
 * conversion line is added when `booking.currency` is a non-INR currency.
 * @param {object} pkg Package
 * @param {{tierId?: string, travelDate?: string, currency?: string}} booking
 * @param {object} breakdown Booking_Breakdown or Land_Total
 * @param {{brandName: string}} business
 * @param {object} [currencies]
 * @returns {string}
 */
export function composeBookingWhatsAppMessage(pkg, booking, breakdown, business, currencies = CURRENCIES) {
  const bk = isObject(booking) ? booking : {};
  const tier = getTier(pkg, breakdown.tierId ?? bk.tierId);
  const inr = (n) => formatPrice(n, "INR", currencies);
  const hasBreakdown = typeof breakdown.advance === "number" && typeof breakdown.rule === "string";

  const lines = [
    `Hello ${business.brandName}! I'd like to book this package.`,
    "",
    `*Package:* ${pkg.title}`,
    pkg.nights != null && pkg.days != null ? `*Duration:* ${pkg.nights}N / ${pkg.days}D` : null,
    `*Hotel tier:* ${tier.label}`,
    `*Adults:* ${breakdown.adults}`,
    breakdown.children > 0 ? `*Children:* ${breakdown.children}` : null,
  ];

  if (hasBreakdown && bk.travelDate) lines.push(`*Travel date:* ${bk.travelDate}`);
  lines.push(`*Land package total:* ${inr(breakdown.total)}`);

  if (hasBreakdown) {
    lines.push(`*Advance on confirmation:* ${inr(breakdown.advance)}`);
    if (breakdown.rule === "standard") {
      lines.push(`*Balance:* ${inr(breakdown.balance)} due by ${breakdown.balanceDueDate}`);
    } else {
      lines.push("Full payment due on confirmation");
    }
  } else {
    lines.push(BOOKING_POLICY_LINE);
  }

  const cur = bk.currency;
  if (typeof cur === "string" && cur !== "INR" && currencies && Object.hasOwn(currencies, cur)) {
    lines.push(`(Indicative: ≈ ${formatPrice(convertPrice(breakdown.total, cur, currencies), cur, currencies)})`);
  }

  lines.push(BOOKING_LAST_LINE);
  return lines.filter((x) => x !== null).join("\n");
}

/** `https://wa.me/{number}?text={encodeURIComponent(message)}`; `number` is digits only. */
export function buildWhatsAppUrl(number, message) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// ---------------------------------------------------------------------------
// CMS content validation (design 7.18 / 7.19)
// ---------------------------------------------------------------------------

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SLUG_MAX = 64;
const IMAGE_MAX = 500;
const PRICE_RANGE = [1, 10_000_000];
const REGIONS = ["international", "domestic"];
const TRANSFER_TYPES = ["private", "sharing", "mixed"];

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isSlug = (s) => typeof s === "string" && s.length <= SLUG_MAX && SLUG_RE.test(s);

/** String with trimmed length ≥ min and raw length ≤ max. */
const textIn = (s, [min, max]) => typeof s === "string" && s.length <= max && s.trim().length >= min;

/** Records `message` under `path` unless that path already has an error. */
function addError(errors, path, message) {
  if (!Object.hasOwn(errors, path)) errors[path] = message;
}

/** `/assets/...` path, or an https: URL whose host is in `imageHosts`; ≤ 500 chars. */
function isAllowedImage(s, imageHosts) {
  if (typeof s !== "string" || s.length === 0 || s.length > IMAGE_MAX || /\s/.test(s)) return false;
  if (s.startsWith("/assets/")) return s.length > "/assets/".length && !s.includes("..");
  let url;
  try {
    url = new URL(s);
  } catch {
    return false;
  }
  const hosts = Array.isArray(imageHosts) ? imageHosts : [];
  return url.protocol === "https:" && hosts.includes(url.hostname);
}

/**
 * Validate an array of strings: array-level error at `path`, item errors at `path[i]`.
 * `optional` lets `undefined` pass (field absent).
 */
function checkStringList(errors, value, path, { count: [minN, maxN], len, optional = false }) {
  if (value === undefined && optional) return;
  if (!Array.isArray(value) || value.length < minN || value.length > maxN) {
    addError(errors, path, `Must be a list of ${minN}–${maxN} items`);
    return;
  }
  value.forEach((s, i) => {
    if (!textIn(s, len)) addError(errors, `${path}[${i}]`, `Must be ${len[0]}–${len[1]} characters`);
  });
}

/** Recursively record every string containing a forbidden phrase (case-insensitive). */
function scanForbidden(errors, value, path, phrases, seen) {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (phrases.some((p) => lower.includes(p))) addError(errors, path || "root", "Contains a forbidden claim");
    return;
  }
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((v, i) => scanForbidden(errors, v, `${path}[${i}]`, phrases, seen));
  } else {
    for (const k of Object.keys(value)) {
      scanForbidden(errors, value[k], path ? `${path}.${k}` : k, phrases, seen);
    }
  }
}

const normalizePhrases = (forbidden) =>
  (Array.isArray(forbidden) ? forbidden : [])
    .filter((p) => typeof p === "string" && p.length > 0)
    .map((p) => p.toLowerCase());

const result = (errors) => ({ valid: Object.keys(errors).length === 0, errors });

/** Validate one tier at `tiers[i]`; `nights` is the package nights or null when invalid. */
function checkTier(errors, t, i, nights, tierIds, seenIds) {
  const p = `tiers[${i}]`;
  if (!isPlainObject(t)) {
    addError(errors, p, "Must be an object");
    return;
  }
  if (typeof t.id !== "string" || !tierIds.includes(t.id) || seenIds.has(t.id)) {
    addError(errors, `${p}.id`, "Must be a unique tier id");
  } else {
    seenIds.add(t.id);
  }
  if (!textIn(t.label, [1, 40])) addError(errors, `${p}.label`, "Must be 1–40 characters");
  if (t.hotelLabel !== undefined && !textIn(t.hotelLabel, [1, 40])) {
    addError(errors, `${p}.hotelLabel`, "Must be 1–40 characters");
  }
  if (t.priceNote !== undefined && !strMax(t.priceNote, 300)) {
    addError(errors, `${p}.priceNote`, "Max 300 characters");
  }
  if (!inRange(t.adultPriceINR, PRICE_RANGE)) addError(errors, `${p}.adultPriceINR`, "Must be an integer 1–10,000,000");
  if (t.childPriceINR !== null && !inRange(t.childPriceINR, PRICE_RANGE)) {
    addError(errors, `${p}.childPriceINR`, "Must be null or an integer 1–10,000,000");
  }

  const hp = `${p}.hotels`;
  if (!Array.isArray(t.hotels) || t.hotels.length < 1 || t.hotels.length > 10) {
    addError(errors, hp, "Must be a list of 1–10 stays");
    return;
  }
  let sum = 0;
  let sumKnown = true;
  t.hotels.forEach((h, j) => {
    const sp = `${hp}[${j}]`;
    if (!isPlainObject(h)) {
      addError(errors, sp, "Must be an object");
      sumKnown = false;
      return;
    }
    if (!textIn(h.location, [1, 80])) addError(errors, `${sp}.location`, "Must be 1–80 characters");
    if (Number.isInteger(h.nights) && h.nights >= 1) {
      sum += h.nights;
    } else {
      addError(errors, `${sp}.nights`, "Must be an integer ≥ 1");
      sumKnown = false;
    }
    checkStringList(errors, h.names, `${sp}.names`, { count: [1, 6], len: [1, 80] });
    if (h.roomType !== null && !strMax(h.roomType, 120)) {
      addError(errors, `${sp}.roomType`, "Must be null or max 120 characters");
    }
  });
  if (sumKnown && nights !== null && sum !== nights) {
    addError(errors, hp, `Hotel nights must add up to ${nights}`);
  }
}

/** Validate `pkg.extras` (flight, visa, on-arrival charges). */
function checkExtras(errors, x) {
  if (!isPlainObject(x)) {
    addError(errors, "extras", "Must be an object");
    return;
  }
  if (x.flightFareINR !== null && !inRange(x.flightFareINR, PRICE_RANGE)) {
    addError(errors, "extras.flightFareINR", "Must be null or an integer 1–10,000,000");
  }
  if (x.flightNote !== null && !strMax(x.flightNote, 300)) {
    addError(errors, "extras.flightNote", "Must be null or max 300 characters");
  }
  if (x.visa !== null) {
    if (!isPlainObject(x.visa)) {
      addError(errors, "extras.visa", "Must be null or { feeINR, type }");
    } else {
      if (!inRange(x.visa.feeINR, PRICE_RANGE)) addError(errors, "extras.visa.feeINR", "Must be an integer 1–10,000,000");
      if (!textIn(x.visa.type, [1, 80])) addError(errors, "extras.visa.type", "Must be 1–80 characters");
    }
  }
  checkStringList(errors, x.onArrivalCharges, "extras.onArrivalCharges", { count: [0, 10], len: [1, 200] });
}

/** Validate the itinerary; `days` is the package days or null when invalid. */
function checkItinerary(errors, it, days) {
  if (!Array.isArray(it) || it.length === 0 || (days !== null && it.length !== days)) {
    addError(errors, "itinerary", days !== null ? `Must have exactly ${days} days` : "Must be a list of days");
    if (!Array.isArray(it)) return;
  }
  it.forEach((d, i) => {
    const p = `itinerary[${i}]`;
    if (!isPlainObject(d)) {
      addError(errors, p, "Must be an object");
      return;
    }
    if (d.day !== i + 1) addError(errors, `${p}.day`, `Must be ${i + 1}`);
    if (!textIn(d.title, [1, 120])) addError(errors, `${p}.title`, "Must be 1–120 characters");
    if (!textIn(d.description, [1, 1000])) addError(errors, `${p}.description`, "Must be 1–1000 characters");
    if (d.transferType !== undefined && !TRANSFER_TYPES.includes(d.transferType)) {
      addError(errors, `${p}.transferType`, "Must be private, sharing or mixed");
    }
  });
}

/**
 * Validate a package for the CMS, the seed script and the content loader (design 7.18).
 * Errors are keyed by the path of the offending field (`root`, `days`, `tiers[1].hotels`, …),
 * at most one per path. Pure; never throws.
 * @param {unknown} pkg
 * @param {{categories?: string[], tierIds?: string[], imageHosts?: string[], forbidden?: string[]}} [opts]
 * @returns {{valid: boolean, errors: Record<string, string>}}
 */
export function validatePackage(pkg, opts = {}) {
  const o = isPlainObject(opts) ? opts : {};
  const {
    categories = CATEGORIES.map((c) => c.id).filter((id) => id !== "all"),
    tierIds = TIER_IDS,
    imageHosts = IMAGE_HOSTS,
    forbidden = FORBIDDEN_CLAIMS,
  } = o;
  if (!isPlainObject(pkg)) return result({ root: "Package must be an object" });
  const errors = {};
  try {
    const catIds = Array.isArray(categories) ? categories : [];
    const tiersAllowed = Array.isArray(tierIds) ? tierIds : [];

    if (!isSlug(pkg.id)) addError(errors, "id", "Must be a lowercase slug of max 64 characters");
    if (!trimmedLenIn(pkg.title, [2, 120])) addError(errors, "title", "Must be 2–120 characters");
    if (!trimmedLenIn(pkg.destination, [2, 120])) addError(errors, "destination", "Must be 2–120 characters");

    const regionOk = REGIONS.includes(pkg.region);
    if (!regionOk) addError(errors, "region", "Must be international or domestic");

    const cats = pkg.categories;
    if (
      !Array.isArray(cats) ||
      cats.length === 0 ||
      new Set(cats).size !== cats.length ||
      !cats.every((c) => catIds.includes(c)) ||
      (regionOk && !cats.includes(pkg.region))
    ) {
      addError(errors, "categories", "Must be unique known categories including the region");
    }

    const nightsOk = inRange(pkg.nights, [1, 60]);
    if (!nightsOk) addError(errors, "nights", "Must be an integer 1–60");
    const daysOk = inRange(pkg.days, [1, 60]) && (!nightsOk || pkg.days === pkg.nights + 1);
    if (!daysOk) addError(errors, "days", "Must equal nights + 1 (1–60)");

    if (!isAllowedImage(pkg.image, imageHosts)) {
      addError(errors, "image", "Must be an /assets/ path or an https URL on an allowed host");
    }
    checkStringList(errors, pkg.highlights, "highlights", { count: [0, 6], len: [1, 80] });
    if (pkg.hotelStarRating !== null && !inRange(pkg.hotelStarRating, [1, 5])) {
      addError(errors, "hotelStarRating", "Must be null or an integer 1–5");
    }
    if (!strMax(pkg.mealPlan, 200)) addError(errors, "mealPlan", "Max 200 characters");
    if (!strMax(pkg.transferBasis, 200)) addError(errors, "transferBasis", "Max 200 characters");

    if (!Array.isArray(pkg.tiers) || pkg.tiers.length < 2 || pkg.tiers.length > 3) {
      addError(errors, "tiers", "Must have 2–3 tiers");
    }
    if (Array.isArray(pkg.tiers)) {
      const seenIds = new Set();
      const nights = nightsOk ? pkg.nights : null;
      pkg.tiers.forEach((t, i) => checkTier(errors, t, i, nights, tiersAllowed, seenIds));
    }

    checkExtras(errors, pkg.extras);
    checkStringList(errors, pkg.inclusions, "inclusions", { count: [1, 20], len: [1, 200], optional: true });
    checkItinerary(errors, pkg.itinerary, daysOk ? pkg.days : null);
    if (pkg.isSample !== undefined && typeof pkg.isSample !== "boolean") {
      addError(errors, "isSample", "Must be true or false");
    }

    // seasons: optional field (undefined = valid, backward compatible)
    if (pkg.seasons !== undefined) {
      if (!Array.isArray(pkg.seasons)) {
        addError(errors, "seasons", "seasons must be an array");
      } else if (pkg.seasons.length > 0) {
        const hasNonInteger = pkg.seasons.some((v) => !Number.isInteger(v));
        if (hasNonInteger) {
          addError(errors, "seasons", "seasons must contain only integers");
        } else {
          const outOfRange = pkg.seasons.some((v) => v < 1 || v > 12);
          if (outOfRange) {
            addError(errors, "seasons", "seasons values must be integers in [1, 12]");
          } else {
            const hasDuplicates = new Set(pkg.seasons).size !== pkg.seasons.length;
            if (hasDuplicates) {
              addError(errors, "seasons", "seasons must not contain duplicate values");
            }
          }
        }
      }
    }

    checkStringList(errors, pkg.notes, "notes", { count: [0, 5], len: [1, 300], optional: true });

    scanForbidden(errors, pkg, "", normalizePhrases(forbidden), new WeakSet());
  } catch {
    // Exotic inputs (e.g. throwing getters) are reported instead of thrown.
    addError(errors, "root", "Package could not be validated");
  }
  return result(errors);
}

/**
 * Validate a destination tile for the CMS and the content loader (design 7.19).
 * When `packageIds` is supplied, a non-null `packageId` must be one of them. Pure; never throws.
 * @param {unknown} dest
 * @param {{packageIds?: string[] | null, imageHosts?: string[], forbidden?: string[]}} [opts]
 * @returns {{valid: boolean, errors: Record<string, string>}}
 */
export function validateDestination(dest, opts = {}) {
  const o = isPlainObject(opts) ? opts : {};
  const { packageIds = null, imageHosts = IMAGE_HOSTS, forbidden = FORBIDDEN_CLAIMS } = o;
  if (!isPlainObject(dest)) return result({ root: "Destination must be an object" });
  const errors = {};
  try {
    if (!isSlug(dest.id)) addError(errors, "id", "Must be a lowercase slug of max 64 characters");
    if (!textIn(dest.name, [1, 80])) addError(errors, "name", "Must be 1–80 characters");
    if (!textIn(dest.tagline, [1, 120])) addError(errors, "tagline", "Must be 1–120 characters");
    if (!REGIONS.includes(dest.region)) addError(errors, "region", "Must be international or domestic");
    if (!isAllowedImage(dest.image, imageHosts)) {
      addError(errors, "image", "Must be an /assets/ path or an https URL on an allowed host");
    }
    if (dest.packageId !== null) {
      const ids = Array.isArray(packageIds) ? packageIds : packageIds instanceof Set ? [...packageIds] : null;
      if (typeof dest.packageId !== "string" || dest.packageId.length === 0) {
        addError(errors, "packageId", "Must be null or a package id");
      } else if (packageIds !== null && packageIds !== undefined && !(ids ?? []).includes(dest.packageId)) {
        addError(errors, "packageId", "Unknown package");
      }
    }
    scanForbidden(errors, dest, "", normalizePhrases(forbidden), new WeakSet());
  } catch {
    addError(errors, "root", "Destination could not be validated");
  }
  return result(errors);
}
