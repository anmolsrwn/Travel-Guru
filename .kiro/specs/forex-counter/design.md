# Design Document: Forex Counter

## Overview

The **Forex Counter** feature extends the Travel Guru Raipur travel agency website by adding foreign exchange services to its service offerings. This feature enables visitors to:

1. Calculate currency exchange rates in real-time using an interactive calculator
2. View buy and sell rates with appropriate margins applied
3. Request formal forex quotes through the existing quote form infrastructure
4. View forex services integrated into the existing services section

The feature leverages the existing currency infrastructure (`CURRENCIES` in `lib/data.js` and `CurrencyProvider.jsx`) while adding forex-specific business logic for rate calculations, margins, transaction limits, and quote generation.

### Design Principles

- **Extend, don't disrupt**: Build on existing architecture patterns (data.js configuration, logic.js pure functions, sections structure)
- **Reuse currency infrastructure**: Leverage the existing `CURRENCIES` object and currency formatting utilities
- **Pure functional core**: All rate calculations and validations are pure, testable functions in `lib/logic.js`
- **Consistent UI patterns**: Follow established component patterns for sections, forms, and validation
- **Accessibility first**: Ensure full keyboard navigation and screen reader support

### Key Architectural Decisions

1. **Data-driven configuration**: All forex parameters (margins, limits, supported currencies) live in `lib/data.js` as exported constants
2. **Pure calculation layer**: Rate calculations implemented as pure functions in `lib/logic.js` for testability
3. **Component separation**: Calculator as a client component, section as a server component
4. **Quote integration**: Extend existing quote form with conditional forex-specific fields
5. **No new API routes**: Quote requests handled by existing `/api/quote` with extended payload

## Architecture

### System Components

```mermaid
graph TB
    subgraph "Data Layer"
        DATA[lib/data.js<br/>FOREX_CONFIG<br/>FOREX_CURRENCIES<br/>SERVICES]
    end
    
    subgraph "Logic Layer"
        CALC[lib/logic.js<br/>Rate Calculations<br/>Quote Generation<br/>Validation]
    end
    
    subgraph "UI Layer - Server"
        SECTION[ForexSection.jsx<br/>Server Component]
        SERVICES[Services.jsx<br/>Updated Service Card]
    end
    
    subgraph "UI Layer - Client"
        CALCULATOR[ForexCalculator.jsx<br/>Interactive Calculator]
        QUOTEFORM[QuoteForm.jsx<br/>Extended with Forex Fields]
    end
    
    subgraph "API Layer"
        QUOTEAPI[/api/quote/route.js<br/>Extended Validation]
    end
    
    subgraph "Admin Layer"
        ADMIN[Admin Leads Table<br/>Forex Details Display]
    end
    
    DATA --> CALC
    CALC --> CALCULATOR
    CALC --> QUOTEFORM
    CALC --> QUOTEAPI
    DATA --> SECTION
    DATA --> SERVICES
    SECTION --> CALCULATOR
    CALCULATOR --> QUOTEFORM
    QUOTEFORM --> QUOTEAPI
    QUOTEAPI --> ADMIN
```

### Data Flow

**Rate Calculation Flow:**
1. User enters amount and selects currency in ForexCalculator
2. Calculator calls `calculateForexQuote()` from logic.js
3. Function retrieves base rates from CURRENCIES object
4. Applies buy/sell margin from FOREX_CONFIG
5. Calculates service fee (if non-zero)
6. Returns quote object with all calculated amounts
7. Calculator formats and displays results using `formatPrice()`

**Quote Request Flow:**
1. User submits forex quote form with direction, currency, amount
2. Form validates using `validateForexQuoteRequest()` from logic.js
3. Validated data sent to `/api/quote` with `forexDetails` object
4. API validates forex-specific fields
5. Stored in database with forex details in JSONB column
6. Admin panel displays forex lead with badge and details

### Technology Stack

- **Next.js 14** (App Router): Server and client components
- **React 18**: Client-side interactivity
- **CSS Modules**: Scoped styling following existing patterns
- **PostgreSQL**: Database storage (existing leads table extended)
- **Node.js built-in test runner**: For unit and property-based tests
- **fast-check**: Property-based testing library

## Components and Interfaces

### 1. Data Configuration (`lib/data.js`)

**Exports Added:**

```javascript
// Supported forex currencies (subset of CURRENCIES, excluding INR)
export const FOREX_CURRENCIES = ["USD", "EUR", "GBP", "AUD", "AED", "SGD"];

// Forex business configuration
export const FOREX_CONFIG = {
  buyMarginPercent: 2.5,      // Markup when customer buys foreign currency
  sellMarginPercent: 3.0,     // Markdown when customer sells foreign currency
  minTransactionINR: 5000,    // Minimum transaction (INR equivalent)
  maxTransactionINR: 500000,  // Maximum transaction (INR equivalent)
  serviceFeePercent: 0        // Additional service fee (0 = margin only)
};

// Add to SERVICES array (after Train service, index 7):
{
  id: "forex",
  icon: "currency",
  title: "Forex",
  subtitle: "Currency Exchange Services",
  quoteOption: "Forex",
  accent: "--svc-teal",  // New color token for forex
  summary: "Competitive exchange rates for international travel",
  bullets: [
    "USD, EUR, GBP, AUD, AED, SGD",
    "Buy and sell foreign currency",
    "Formal quotes within 24 hours"
  ]
}

// Add to QUOTE_SERVICE_OPTIONS array:
"Forex"  // Appended at end (index 8)
```

**Design Rationale:**
- Constants are editable in one place without code changes
- Margins are configurable for business adjustments
- Transaction limits prevent edge cases and fraud
- Service fee set to 0 initially (margins provide revenue)
- FOREX_CURRENCIES excludes INR (base currency, not exchangeable)

### 2. Logic Module (`lib/logic.js`)

**Function Signatures:**

```javascript
/**
 * Calculate buy rate (customer buys foreign currency, pays INR)
 * @param {string} baseCurrency - Must be "INR"
 * @param {string} targetCurrency - Currency to buy
 * @param {object} currencies - CURRENCIES object
 * @param {object} forexConfig - FOREX_CONFIG object
 * @returns {number} Rate with buy margin applied
 * @throws {Error} If currencies invalid or base not INR
 */
export function calculateForexBuyRate(baseCurrency, targetCurrency, currencies, forexConfig)

/**
 * Calculate sell rate (customer sells foreign currency, receives INR)
 * @param {string} baseCurrency - Must be "INR"
 * @param {string} targetCurrency - Currency to sell
 * @param {object} currencies - CURRENCIES object
 * @param {object} forexConfig - FOREX_CONFIG object
 * @returns {number} Rate with sell margin applied
 * @throws {Error} If currencies invalid or base not INR
 */
export function calculateForexSellRate(baseCurrency, targetCurrency, currencies, forexConfig)

/**
 * Calculate complete forex quote
 * @param {string} direction - "buy" | "sell"
 * @param {string} sourceCurrency - INR for buy, foreign for sell
 * @param {string} targetCurrency - Foreign for buy, INR for sell
 * @param {number} amount - Amount in source currency
 * @param {object} currencies - CURRENCIES object
 * @param {object} forexConfig - FOREX_CONFIG object
 * @returns {object} Quote object with amounts, rate, fee, total
 * @throws {Error} If validation fails or amount outside range
 */
export function calculateForexQuote(direction, sourceCurrency, targetCurrency, amount, currencies, forexConfig)

/**
 * Validate forex configuration
 * @param {object} config - FOREX_CONFIG object
 * @returns {{valid: boolean, errors: object}}
 */
export function validateForexConfig(config)

/**
 * Validate forex quote request
 * @param {object} request - {direction, currency, amount}
 * @param {object} forexConfig - FOREX_CONFIG object
 * @param {string[]} forexCurrencies - FOREX_CURRENCIES array
 * @returns {{valid: boolean, errors: object}}
 */
export function validateForexQuoteRequest(request, forexConfig, forexCurrencies)
```

**Calculation Logic:**

```javascript
// Buy Rate Calculation
buyRate = baseCurrencyRate * (1 + buyMarginPercent / 100)
// Example: USD base 0.012, margin 2.5%
// buyRate = 0.012 * 1.025 = 0.0123

// Sell Rate Calculation
sellRate = baseCurrencyRate * (1 - sellMarginPercent / 100)
// Example: USD base 0.012, margin 3.0%
// sellRate = 0.012 * 0.97 = 0.01164

// Buy Quote (customer buys foreign currency)
sourceAmount = amount (in foreign currency)
rate = calculateForexBuyRate(...)
targetAmount = sourceAmount / rate (INR customer pays)
serviceFee = targetAmount * (serviceFeePercent / 100)
totalINR = targetAmount + serviceFee

// Sell Quote (customer sells foreign currency)
sourceAmount = amount (in foreign currency)
rate = calculateForexSellRate(...)
targetAmount = sourceAmount / rate (INR customer receives)
serviceFee = targetAmount * (serviceFeePercent / 100)
totalINR = targetAmount - serviceFee
```

**Validation Rules:**

```javascript
// Config Validation
- buyMarginPercent: 0 <= n <= 20
- sellMarginPercent: 0 <= n <= 20
- minTransactionINR: >= 1000 and < maxTransactionINR
- maxTransactionINR: > minTransactionINR
- serviceFeePercent: >= 0

// Quote Request Validation
- direction: "buy" | "sell" (exact string match)
- currency: must be in FOREX_CURRENCIES array
- amount: positive number
- INR equivalent: minTransactionINR <= amount <= maxTransactionINR
```

### 3. ForexCalculator Component (`components/client/ForexCalculator.jsx`)

**Component Structure:**

```jsx
"use client";

import { useState, useEffect, useId } from "react";
import { FOREX_CURRENCIES, FOREX_CONFIG, CURRENCIES } from "@/lib/data";
import { calculateForexQuote, formatPrice } from "@/lib/logic";
import { useQuoteIntent } from "./QuoteIntentProvider";
import styles from "./ForexCalculator.module.css";

export function ForexCalculator() {
  const [direction, setDirection] = useState("buy");  // "buy" | "sell"
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  
  const { enquireService } = useQuoteIntent();
  const groupId = useId();
  
  // Debounced calculation on input change
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateResult();
    }, 300);
    return () => clearTimeout(timer);
  }, [direction, currency, amount]);
  
  function calculateResult() {
    // Validation and calculation logic
    // Updates result state or error state
  }
  
  function handleGetQuote() {
    enquireService("Forex", {
      direction,
      currency,
      amount: parseFloat(amount)
    });
  }
  
  return (
    <div className={styles.calculator}>
      {/* Direction toggle */}
      {/* Currency selector */}
      {/* Amount input */}
      {/* Result display */}
      {/* Error display */}
      {/* Get Formal Quote button */}
    </div>
  );
}
```

**State Management:**
- `direction`: "buy" or "sell" (default: "buy")
- `currency`: Selected forex currency code (default: "USD")
- `amount`: User input string (validated to number)
- `result`: Calculated quote object or null
- `error`: Validation error message or empty string

**Calculation Trigger:**
- 300ms debounce after any input change
- Validates amount is numeric, non-negative, within range
- Calls `calculateForexQuote()` with current state
- Updates result or error state

**Accessibility Features:**
- Direction toggle: `role="radiogroup"` with `role="radio"` options
- Currency selector: Native `<select>` with associated `<label>`
- Amount input: `type="number"`, `inputmode="decimal"`, `aria-describedby` for errors
- Result display: `aria-live="polite"` region
- Button: Descriptive text including direction and currency
- Keyboard navigation: Tab order follows visual order

### 4. ForexSection Component (`components/sections/ForexSection.jsx`)

**Component Structure:**

```jsx
import { FOREX_CURRENCIES, CURRENCIES } from "@/lib/data";
import { Reveal } from "@/components/client/Reveal";
import { ForexCalculator } from "@/components/client/ForexCalculator";
import styles from "./ForexSection.module.css";

export function ForexSection() {
  return (
    <section 
      id="forex-counter" 
      className="section section--alt" 
      aria-labelledby="forex-title"
    >
      <Reveal className="container">
        <div className="eyebrow">Forex Counter</div>
        
        <h2 id="forex-title" className={styles.title}>
          Exchange Foreign Currency with{" "}
          <span className="--brand-grad">Confidence</span>
        </h2>
        
        <p className="lead">
          Travel Guru Raipur offers competitive foreign exchange rates
          for major currencies. Calculate rates instantly and get a
          formal quote within 24 hours.
        </p>
        
        <ForexCalculator />
        
        <div className={styles.currencies}>
          <h3>Supported Currencies</h3>
          <ul className={styles.currencyList}>
            {FOREX_CURRENCIES.map(code => (
              <li key={code}>
                {code} <span>({CURRENCIES[code].symbol})</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
```

**Placement:**
- Rendered in `app/(site)/page.js` between Services and Destinations sections
- Uses alternating section background (--alt class)
- Applies scroll-reveal animation via Reveal component

**Responsive Behavior:**
- Mobile: Single column, full-width calculator
- Tablet/Desktop: Calculator in card layout, results beside inputs
- Currency list: Grid layout adapting to viewport width

### 5. Quote Form Extension (`components/client/QuoteForm.jsx`)

**Conditional Forex Fields:**

When "Forex" is selected in services:

```jsx
{form.services.includes("Forex") && (
  <div className={styles.forexFields}>
    {/* Direction Toggle */}
    <div role="radiogroup" aria-label="Transaction direction">
      <label>
        <input 
          type="radio" 
          name="forexDirection" 
          value="buy"
          checked={form.forexDirection === "buy"}
          onChange={(e) => setForm({...form, forexDirection: e.target.value})}
        />
        Buy Foreign Currency
      </label>
      <label>
        <input 
          type="radio" 
          name="forexDirection" 
          value="sell"
          checked={form.forexDirection === "sell"}
          onChange={(e) => setForm({...form, forexDirection: e.target.value})}
        />
        Sell Foreign Currency
      </label>
    </div>
    
    {/* Currency Selector */}
    <label>
      Currency
      <select
        value={form.forexCurrency}
        onChange={(e) => setForm({...form, forexCurrency: e.target.value})}
      >
        <option value="">Select currency</option>
        {FOREX_CURRENCIES.map(code => (
          <option key={code} value={code}>
            {code} ({CURRENCIES[code].symbol})
          </option>
        ))}
      </select>
    </label>
    
    {/* Amount Input */}
    <label>
      Amount {form.forexDirection === "buy" ? `(${form.forexCurrency})` : `(${form.forexCurrency})`}
      <input
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        value={form.forexAmount}
        onChange={(e) => setForm({...form, forexAmount: e.target.value})}
        aria-describedby={errors.forexAmount ? "forex-amount-error" : undefined}
        aria-invalid={!!errors.forexAmount}
      />
      {errors.forexAmount && (
        <span id="forex-amount-error" className="error">
          {errors.forexAmount}
        </span>
      )}
    </label>
  </div>
)}
```

**Form State Extension:**

```javascript
const initialQuoteForm = {
  // ...existing fields...
  forexDirection: "buy",
  forexCurrency: "",
  forexAmount: ""
};
```

**Validation Extension:**

```javascript
function validateForm(form) {
  const errors = {};
  
  // ...existing validations...
  
  if (form.services.includes("Forex")) {
    if (!["buy", "sell"].includes(form.forexDirection)) {
      errors.forexDirection = "Select buy or sell";
    }
    if (!FOREX_CURRENCIES.includes(form.forexCurrency)) {
      errors.forexCurrency = "Select a currency";
    }
    const amount = parseFloat(form.forexAmount);
    if (!amount || amount <= 0) {
      errors.forexAmount = "Enter a valid amount";
    } else {
      // Validate range using validateForexQuoteRequest
      const validation = validateForexQuoteRequest(
        {
          direction: form.forexDirection,
          currency: form.forexCurrency,
          amount: amount
        },
        FOREX_CONFIG,
        FOREX_CURRENCIES
      );
      if (!validation.valid) {
        Object.assign(errors, validation.errors);
      }
    }
  }
  
  return errors;
}
```

**API Payload:**

```javascript
const payload = {
  // ...existing fields...
  services: form.services,
  forexDetails: form.services.includes("Forex") ? {
    direction: form.forexDirection,
    currency: form.forexCurrency,
    amount: parseFloat(form.forexAmount)
  } : undefined
};
```

### 6. API Route Extension (`app/api/quote/route.js`)

**Validation Addition:**

```javascript
import { validateForexQuoteRequest } from "@/lib/logic";
import { FOREX_CONFIG, FOREX_CURRENCIES } from "@/lib/data";

export async function POST(request) {
  // ...existing validation...
  
  // Forex-specific validation
  if (Array.isArray(body.services) && body.services.includes("Forex")) {
    if (!body.forexDetails || typeof body.forexDetails !== "object") {
      return NextResponse.json(
        { error: "Forex details required" },
        { status: 400 }
      );
    }
    
    const forexValidation = validateForexQuoteRequest(
      body.forexDetails,
      FOREX_CONFIG,
      FOREX_CURRENCIES
    );
    
    if (!forexValidation.valid) {
      return NextResponse.json(
        { error: "Invalid forex details", details: forexValidation.errors },
        { status: 400 }
      );
    }
  }
  
  // ...insert to database...
}
```

**Database Schema:**

Existing `leads` table extended with:

```sql
ALTER TABLE leads 
ADD COLUMN forex_details JSONB;

-- Example stored data:
{
  "direction": "buy",
  "currency": "USD",
  "amount": 1000
}
```

### 7. Admin Panel Extension

**Leads Table Display:**

```jsx
// In components/admin/LeadsTable.jsx

function ServiceBadges({ services }) {
  return (
    <div className={styles.badges}>
      {services.map(service => (
        <span 
          key={service}
          className={`${styles.badge} ${
            service === "Forex" ? styles.badgeForex : ""
          }`}
        >
          {service}
        </span>
      ))}
    </div>
  );
}

function ForexDetails({ forexDetails }) {
  if (!forexDetails) return null;
  
  const { direction, currency, amount } = forexDetails;
  return (
    <div className={styles.forexDetails}>
      <strong>Forex:</strong>{" "}
      {direction === "buy" ? "Buy" : "Sell"} {amount} {currency}
    </div>
  );
}

// In lead row rendering:
<td>
  <ServiceBadges services={lead.services} />
  <ForexDetails forexDetails={lead.forex_details} />
</td>
```

**Lead Detail View:**

Display forex details prominently when present:
- Direction: Buy or Sell
- Currency: Code and symbol
- Amount: Formatted with currency
- Calculated rate (if shown): Using current FOREX_CONFIG

## Data Models

### ForexConfig

```typescript
interface ForexConfig {
  buyMarginPercent: number;      // 0-20, typically 2-5
  sellMarginPercent: number;     // 0-20, typically 2-5
  minTransactionINR: number;     // Minimum 1000
  maxTransactionINR: number;     // Must be > min
  serviceFeePercent: number;     // >= 0, typically 0-2
}
```

**Validation Rules:**
- All values must be numbers
- Margins: 0 ≤ n ≤ 20
- minTransactionINR: ≥ 1000
- maxTransactionINR: > minTransactionINR
- serviceFeePercent: ≥ 0

### ForexQuote

```typescript
interface ForexQuote {
  direction: "buy" | "sell";
  sourceAmount: number;          // Amount in source currency
  sourceCurrency: string;        // "INR" or forex currency
  targetAmount: number;          // Amount in target currency
  targetCurrency: string;        // Forex currency or "INR"
  rate: number;                  // Exchange rate used
  serviceFee: number;            // Fee in INR
  totalINR: number;              // Total payable or receivable in INR
}
```

**Example Buy Quote:**
```json
{
  "direction": "buy",
  "sourceAmount": 1000,
  "sourceCurrency": "USD",
  "targetAmount": 82500,
  "targetCurrency": "INR",
  "rate": 0.0123,
  "serviceFee": 0,
  "totalINR": 82500
}
```

**Example Sell Quote:**
```json
{
  "direction": "sell",
  "sourceAmount": 1000,
  "sourceCurrency": "USD",
  "targetAmount": 85900,
  "targetCurrency": "INR",
  "rate": 0.01164,
  "serviceFee": 0,
  "totalINR": 85900
}
```

### ForexQuoteRequest

```typescript
interface ForexQuoteRequest {
  direction: "buy" | "sell";
  currency: string;              // Must be in FOREX_CURRENCIES
  amount: number;                // Positive number
}
```

**Validation:**
- direction: Exact match "buy" or "sell"
- currency: Must exist in FOREX_CURRENCIES array
- amount: Must be positive and within INR equivalent range

### ForexLeadData

```typescript
interface ForexLeadData {
  // ...existing lead fields...
  services: string[];            // Includes "Forex"
  forex_details: {
    direction: "buy" | "sell";
    currency: string;
    amount: number;
  } | null;
}
```

**Database Storage:**
- Stored in `leads.forex_details` JSONB column
- Null when "Forex" not in services
- Indexed for efficient querying

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I identified the following properties suitable for property-based testing. I performed reflection to eliminate redundancy:

**Identified Properties:**
- 2.2: Buy rate calculation formula (for any currency)
- 2.4: Sell rate calculation formula (for any currency)
- 2.5: Unsupported currency error (for any invalid currency)
- 2.6: Non-INR base currency error (for any non-INR base)
- 2.8: Buy quote structure and calculation (for any valid buy parameters)
- 2.9: Sell quote structure and calculation (for any valid sell parameters)
- 2.10: Service fee calculation (for any quote)
- 2.11: Amount range validation (for any out-of-range amount)
- 5.2: Forex form validation (for any invalid field combination)
- 5.4: API validation (for any invalid request)
- 5.5: Data persistence (for any valid request)
- 7.2: Config margin validation (for any invalid margin)
- 7.3: Config limit validation (for any invalid limits)
- 7.5: Valid request passes validation (for any valid request)
- 7.6: Invalid direction caught (for any non-buy/sell string)
- 7.7: Invalid currency caught (for any unsupported currency)
- 7.8: Invalid amount caught (for any non-positive amount)
- 9.P1: Buy rate > base rate
- 9.P2: Sell rate < base rate
- 9.P3: Buy-sell spread is positive
- 9.P4: Quote amounts are proportional
- 9.P5: Round-trip loses value

**Redundancy Analysis:**

1. **Properties 2.2 and 9.P1 overlap**: Property 2.2 tests the buy rate formula is applied correctly, while 9.P1 tests that buy rate is higher than base rate. Since 9.P1 is a consequence of 2.2 (when margin > 0), and 9.P1 provides a simpler invariant check, I'll **keep 9.P1 and merge 2.2 into it** as a comprehensive property that tests both the formula and the invariant.

2. **Properties 2.4 and 9.P2 overlap**: Similar to above, 9.P2 is a consequence of 2.4. I'll **keep 9.P2 and merge 2.4 into it**.

3. **Property 9.P3 is implied by 9.P1 + 9.P2**: If buy rate > base and sell rate < base, then buy > sell. However, **keep 9.P3** as it directly tests the spread, which is a critical business property.

4. **Properties 2.5, 2.6, 2.11 can be combined**: All three test error conditions. I'll **combine them into a single property** about error handling covering all invalid inputs.

5. **Properties 2.8 and 2.9 can be combined**: Both test quote structure and calculation. I'll **combine into one comprehensive property** that tests both buy and sell directions.

6. **Property 2.10 is subsumed by combined 2.8/2.9**: Service fee calculation is part of quote calculation, so it's covered. **Remove as separate property**.

7. **Properties 5.2, 5.4, 7.5, 7.6, 7.7, 7.8 overlap**: These all test validation logic at different layers but with the same underlying logic. I'll **consolidate into validation properties** that test the logic module functions comprehensively.

8. **Properties 7.2 and 7.3 can be combined**: Both test config validation. **Combine into one config validation property**.

9. **Property 5.5 is an integration property**: Data persistence across layers. This is more suited to integration testing than property-based testing. **Remove from PBT, add to integration test strategy**.

**Final Property Set (after removing redundancy):**

1. **Buy rate formula and invariant** (combines 2.2, 9.P1)
2. **Sell rate formula and invariant** (combines 2.4, 9.P2)
3. **Buy-sell spread is positive** (9.P3)
4. **Error handling for invalid inputs** (combines 2.5, 2.6, 2.11)
5. **Quote calculation correctness** (combines 2.8, 2.9)
6. **Quote amounts are proportional** (9.P4)
7. **Round-trip loses value** (9.P5)
8. **Validation logic correctness** (combines 5.2, 5.4, 7.5, 7.6, 7.7, 7.8)
9. **Config validation correctness** (combines 7.2, 7.3)

This reduces 23 identified properties to 9 comprehensive, non-redundant properties.

### Property 1: Buy Rate Formula and Invariant

*For any* valid forex currency in FOREX_CURRENCIES and any valid FOREX_CONFIG with positive buyMarginPercent, the calculated buy rate SHALL equal the base currency rate multiplied by (1 + buyMarginPercent/100), and SHALL be greater than the base rate.

**Validates: Requirements 2.2, 9.P1**

**Test Implementation:**
```javascript
// Property test with fast-check, 100+ iterations
fc.property(
  fc.constantFrom(...FOREX_CURRENCIES),
  fc.record({
    buyMarginPercent: fc.float({ min: 0.1, max: 20, noNaN: true }),
    sellMarginPercent: fc.float({ min: 0.1, max: 20, noNaN: true }),
    minTransactionINR: fc.constant(5000),
    maxTransactionINR: fc.constant(500000),
    serviceFeePercent: fc.constant(0)
  }),
  (currency, config) => {
    const baseRate = CURRENCIES[currency].rate;
    const buyRate = calculateForexBuyRate("INR", currency, CURRENCIES, config);
    const expectedRate = baseRate * (1 + config.buyMarginPercent / 100);
    
    // Formula is correct (within floating point tolerance)
    const formulaCorrect = Math.abs(buyRate - expectedRate) < 0.0000001;
    
    // Invariant holds: buy rate > base rate
    const invariantHolds = buyRate > baseRate;
    
    return formulaCorrect && invariantHolds;
  }
)
```

### Property 2: Sell Rate Formula and Invariant

*For any* valid forex currency in FOREX_CURRENCIES and any valid FOREX_CONFIG with positive sellMarginPercent, the calculated sell rate SHALL equal the base currency rate multiplied by (1 - sellMarginPercent/100), and SHALL be less than the base rate.

**Validates: Requirements 2.4, 9.P2**

**Test Implementation:**
```javascript
fc.property(
  fc.constantFrom(...FOREX_CURRENCIES),
  fc.record({
    buyMarginPercent: fc.float({ min: 0.1, max: 20, noNaN: true }),
    sellMarginPercent: fc.float({ min: 0.1, max: 20, noNaN: true }),
    minTransactionINR: fc.constant(5000),
    maxTransactionINR: fc.constant(500000),
    serviceFeePercent: fc.constant(0)
  }),
  (currency, config) => {
    const baseRate = CURRENCIES[currency].rate;
    const sellRate = calculateForexSellRate("INR", currency, CURRENCIES, config);
    const expectedRate = baseRate * (1 - config.sellMarginPercent / 100);
    
    // Formula is correct
    const formulaCorrect = Math.abs(sellRate - expectedRate) < 0.0000001;
    
    // Invariant holds: sell rate < base rate
    const invariantHolds = sellRate < baseRate;
    
    return formulaCorrect && invariantHolds;
  }
)
```

### Property 3: Buy-Sell Spread is Positive

*For any* valid forex currency in FOREX_CURRENCIES and any valid FOREX_CONFIG with positive margins, the buy rate minus the sell rate SHALL be greater than zero.

**Validates: Requirements 9.P3**

**Test Implementation:**
```javascript
fc.property(
  fc.constantFrom(...FOREX_CURRENCIES),
  fc.record({
    buyMarginPercent: fc.float({ min: 0.1, max: 20, noNaN: true }),
    sellMarginPercent: fc.float({ min: 0.1, max: 20, noNaN: true }),
    minTransactionINR: fc.constant(5000),
    maxTransactionINR: fc.constant(500000),
    serviceFeePercent: fc.constant(0)
  }),
  (currency, config) => {
    const buyRate = calculateForexBuyRate("INR", currency, CURRENCIES, config);
    const sellRate = calculateForexSellRate("INR", currency, CURRENCIES, config);
    const spread = buyRate - sellRate;
    
    return spread > 0;
  }
)
```

### Property 4: Error Handling for Invalid Inputs

*For any* invalid input (unsupported currency, non-INR base currency, or amount outside allowed range), the rate calculation and quote generation functions SHALL throw an error with an appropriate message.

**Validates: Requirements 2.5, 2.6, 2.11**

**Test Implementation:**
```javascript
// Test 4a: Unsupported currency
fc.property(
  fc.string().filter(s => !FOREX_CURRENCIES.includes(s) && s !== "INR"),
  (invalidCurrency) => {
    try {
      calculateForexBuyRate("INR", invalidCurrency, CURRENCIES, FOREX_CONFIG);
      return false; // Should have thrown
    } catch (e) {
      return e.message.includes("Unsupported currency");
    }
  }
)

// Test 4b: Non-INR base currency
fc.property(
  fc.string().filter(s => s !== "INR"),
  fc.constantFrom(...FOREX_CURRENCIES),
  (invalidBase, targetCurrency) => {
    try {
      calculateForexBuyRate(invalidBase, targetCurrency, CURRENCIES, FOREX_CONFIG);
      return false;
    } catch (e) {
      return e.message.includes("Base currency must be INR");
    }
  }
)

// Test 4c: Amount outside range
fc.property(
  fc.constantFrom("buy", "sell"),
  fc.constantFrom(...FOREX_CURRENCIES),
  fc.oneof(
    fc.float({ min: 0.01, max: FOREX_CONFIG.minTransactionINR - 1 }),
    fc.float({ min: FOREX_CONFIG.maxTransactionINR + 1, max: 1000000 })
  ),
  (direction, currency, invalidAmount) => {
    try {
      calculateForexQuote(direction, "INR", currency, invalidAmount, CURRENCIES, FOREX_CONFIG);
      return false;
    } catch (e) {
      return e.message.includes("Amount outside allowed range");
    }
  }
)
```

### Property 5: Quote Calculation Correctness

*For any* valid direction ("buy" or "sell"), valid forex currency, and valid amount within range, the calculated quote SHALL have correct structure (all required fields present) and correct calculated values (amounts, rate, fee, total consistent with the formula).

**Validates: Requirements 2.8, 2.9**

**Test Implementation:**
```javascript
fc.property(
  fc.constantFrom("buy", "sell"),
  fc.constantFrom(...FOREX_CURRENCIES),
  fc.float({ 
    min: FOREX_CONFIG.minTransactionINR, 
    max: FOREX_CONFIG.maxTransactionINR 
  }),
  (direction, currency, amount) => {
    const quote = calculateForexQuote(
      direction, 
      "INR", 
      currency, 
      amount, 
      CURRENCIES, 
      FOREX_CONFIG
    );
    
    // Structure check
    const hasStructure = (
      typeof quote.sourceAmount === "number" &&
      typeof quote.targetAmount === "number" &&
      typeof quote.rate === "number" &&
      typeof quote.serviceFee === "number" &&
      typeof quote.totalINR === "number"
    );
    
    if (!hasStructure) return false;
    
    // Calculation check
    const rate = direction === "buy"
      ? calculateForexBuyRate("INR", currency, CURRENCIES, FOREX_CONFIG)
      : calculateForexSellRate("INR", currency, CURRENCIES, FOREX_CONFIG);
    
    const rateMatches = Math.abs(quote.rate - rate) < 0.0000001;
    
    // Total check
    const totalCorrect = direction === "buy"
      ? Math.abs(quote.totalINR - (quote.targetAmount + quote.serviceFee)) < 0.01
      : Math.abs(quote.totalINR - (quote.targetAmount - quote.serviceFee)) < 0.01;
    
    return rateMatches && totalCorrect;
  }
)
```

### Property 6: Quote Amounts are Proportional

*For any* valid quote request, doubling the input amount SHALL result in approximately doubling the sourceAmount and targetAmount (within rounding tolerance of 0.01).

**Validates: Requirements 9.P4**

**Test Implementation:**
```javascript
fc.property(
  fc.constantFrom("buy", "sell"),
  fc.constantFrom(...FOREX_CURRENCIES),
  fc.float({ 
    min: FOREX_CONFIG.minTransactionINR, 
    max: FOREX_CONFIG.maxTransactionINR / 2  // Ensure 2x is still in range
  }),
  (direction, currency, amount) => {
    const quote1 = calculateForexQuote(
      direction, "INR", currency, amount, CURRENCIES, FOREX_CONFIG
    );
    const quote2 = calculateForexQuote(
      direction, "INR", currency, amount * 2, CURRENCIES, FOREX_CONFIG
    );
    
    const sourceProportional = Math.abs(
      quote2.sourceAmount - (quote1.sourceAmount * 2)
    ) < 0.01;
    
    const targetProportional = Math.abs(
      quote2.targetAmount - (quote1.targetAmount * 2)
    ) < 0.01;
    
    return sourceProportional && targetProportional;
  }
)
```

### Property 7: Round-Trip Loses Value

*For any* valid amount in INR, calculating a buy quote to receive foreign currency, then calculating a sell quote for that received foreign currency, SHALL result in receiving less INR than the original amount (due to buy-sell spread).

**Validates: Requirements 9.P5**

**Test Implementation:**
```javascript
fc.property(
  fc.constantFrom(...FOREX_CURRENCIES),
  fc.float({ 
    min: FOREX_CONFIG.minTransactionINR, 
    max: FOREX_CONFIG.maxTransactionINR 
  }),
  (currency, amountINR) => {
    // Buy foreign currency with INR
    const buyQuote = calculateForexQuote(
      "buy", "INR", currency, amountINR, CURRENCIES, FOREX_CONFIG
    );
    
    const foreignCurrencyReceived = buyQuote.targetAmount;
    
    // Sell that foreign currency back to get INR
    const sellQuote = calculateForexQuote(
      "sell", currency, "INR", foreignCurrencyReceived, CURRENCIES, FOREX_CONFIG
    );
    
    const inrReceived = sellQuote.totalINR;
    
    // Should receive less than original due to spread
    return inrReceived < amountINR;
  }
)
```

### Property 8: Validation Logic Correctness

*For any* forex quote request object, the validation function SHALL return `{valid: true}` if and only if the request has a valid direction ("buy" or "sell"), a valid currency in FOREX_CURRENCIES, and a positive numeric amount.

**Validates: Requirements 5.2, 5.4, 7.5, 7.6, 7.7, 7.8**

**Test Implementation:**
```javascript
// Test 8a: Valid requests pass
fc.property(
  fc.constantFrom("buy", "sell"),
  fc.constantFrom(...FOREX_CURRENCIES),
  fc.float({ min: 0.01, max: 1000000, noNaN: true }),
  (direction, currency, amount) => {
    const result = validateForexQuoteRequest(
      { direction, currency, amount },
      FOREX_CONFIG,
      FOREX_CURRENCIES
    );
    return result.valid === true && Object.keys(result.errors).length === 0;
  }
)

// Test 8b: Invalid direction fails
fc.property(
  fc.string().filter(s => s !== "buy" && s !== "sell"),
  fc.constantFrom(...FOREX_CURRENCIES),
  fc.float({ min: 0.01, max: 1000000 }),
  (invalidDirection, currency, amount) => {
    const result = validateForexQuoteRequest(
      { direction: invalidDirection, currency, amount },
      FOREX_CONFIG,
      FOREX_CURRENCIES
    );
    return result.valid === false && result.errors.direction !== undefined;
  }
)

// Test 8c: Invalid currency fails
fc.property(
  fc.constantFrom("buy", "sell"),
  fc.string().filter(s => !FOREX_CURRENCIES.includes(s)),
  fc.float({ min: 0.01, max: 1000000 }),
  (direction, invalidCurrency, amount) => {
    const result = validateForexQuoteRequest(
      { direction, currency: invalidCurrency, amount },
      FOREX_CONFIG,
      FOREX_CURRENCIES
    );
    return result.valid === false && result.errors.currency !== undefined;
  }
)

// Test 8d: Non-positive amount fails
fc.property(
  fc.constantFrom("buy", "sell"),
  fc.constantFrom(...FOREX_CURRENCIES),
  fc.oneof(
    fc.constant(0),
    fc.float({ min: -1000000, max: -0.01 }),
    fc.constant(NaN),
    fc.constant(Infinity)
  ),
  (direction, currency, invalidAmount) => {
    const result = validateForexQuoteRequest(
      { direction, currency, amount: invalidAmount },
      FOREX_CONFIG,
      FOREX_CURRENCIES
    );
    return result.valid === false && result.errors.amount !== undefined;
  }
)
```

### Property 9: Config Validation Correctness

*For any* forex configuration object, the validation function SHALL return `{valid: true}` if and only if all margin percentages are between 0 and 20, minTransactionINR is at least 1000, and maxTransactionINR is greater than minTransactionINR.

**Validates: Requirements 7.2, 7.3**

**Test Implementation:**
```javascript
// Test 9a: Valid config passes
fc.property(
  fc.float({ min: 0, max: 20, noNaN: true }),
  fc.float({ min: 0, max: 20, noNaN: true }),
  fc.integer({ min: 1000, max: 100000 }),
  fc.integer({ min: 100001, max: 1000000 }),
  fc.float({ min: 0, max: 10, noNaN: true }),
  (buyMargin, sellMargin, minTx, maxTx, serviceFee) => {
    const config = {
      buyMarginPercent: buyMargin,
      sellMarginPercent: sellMargin,
      minTransactionINR: minTx,
      maxTransactionINR: maxTx,
      serviceFeePercent: serviceFee
    };
    const result = validateForexConfig(config);
    return result.valid === true;
  }
)

// Test 9b: Invalid margins fail
fc.property(
  fc.oneof(
    fc.float({ min: -100, max: -0.01 }),
    fc.float({ min: 20.01, max: 100 })
  ),
  (invalidMargin) => {
    const config = {
      ...FOREX_CONFIG,
      buyMarginPercent: invalidMargin
    };
    const result = validateForexConfig(config);
    return result.valid === false && result.errors.margins !== undefined;
  }
)

// Test 9c: Invalid transaction limits fail
fc.property(
  fc.integer({ min: 1, max: 999 }),  // Below 1000
  (invalidMin) => {
    const config = {
      ...FOREX_CONFIG,
      minTransactionINR: invalidMin
    };
    const result = validateForexConfig(config);
    return result.valid === false && result.errors.transactionLimits !== undefined;
  }
)

fc.property(
  fc.integer({ min: 1000, max: 100000 }),
  fc.integer({ min: 1000, max: 100000 }),
  (min, max) => {
    fc.pre(min >= max);  // Ensure invalid: min >= max
    const config = {
      ...FOREX_CONFIG,
      minTransactionINR: min,
      maxTransactionINR: max
    };
    const result = validateForexConfig(config);
    return result.valid === false;
  }
)
```

## Error Handling

### Input Validation Errors

**Client-Side Validation:**
- Invalid amount (non-numeric, negative, outside range): Display inline error message "Amount must be between ₹5,000 and ₹5,00,000 equivalent"
- Missing forex fields when Forex service selected: Prevent form submission, highlight required fields
- Invalid currency selection: Select element prevents invalid selection (constraint via options)
- Invalid direction: Radio group prevents invalid selection (constraint via options)

**Error Display Pattern:**
```jsx
{error && (
  <div className={styles.error} role="alert">
    {error}
  </div>
)}
```

**Validation Timing:**
- Calculator: On input change with 300ms debounce
- Quote Form: On blur and on submit attempt
- API: On request receipt before processing

### Calculation Errors

**Rate Calculation Errors:**
```javascript
// Unsupported currency
throw new Error("Unsupported currency: " + currency);

// Non-INR base currency
throw new Error("Base currency must be INR");

// Amount outside range
throw new Error("Amount outside allowed range");
```

**Handling Strategy:**
- All calculation errors caught in UI components
- Displayed as user-friendly messages
- Never expose technical details to users
- Log errors server-side for debugging

### API Errors

**Validation Errors (400):**
```json
{
  "error": "Invalid forex details",
  "details": {
    "direction": "Must be 'buy' or 'sell'",
    "currency": "Unsupported currency",
    "amount": "Must be a positive number"
  }
}
```

**Server Errors (500):**
```json
{
  "error": "Server error processing forex quote"
}
```

**Error Handling in Client:**
```javascript
try {
  const response = await fetch("/api/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const error = await response.json();
    setErrors(error.details || { general: error.error });
    return;
  }
  
  // Success handling...
} catch (err) {
  setErrors({ general: "Network error. Please try again." });
}
```

### Database Errors

**Constraint Violations:**
- Foreign key violations: Handled by schema (leads table already exists)
- JSON schema violations: Validated before insert
- Null constraints: forex_details is nullable (only present for forex quotes)

**Error Recovery:**
- Transactional inserts with rollback on failure
- Retry logic for transient errors (connection timeouts)
- Error logging for persistent failures
- User-facing message: "Unable to submit quote. Please try again."

### Edge Cases

**Floating Point Precision:**
- All currency calculations rounded to 2 decimal places using `roundHalfUp2()`
- Comparison tolerance: 0.0000001 for rate comparisons, 0.01 for amount comparisons
- Never use direct equality (===) for floating point comparisons

**Boundary Values:**
- Minimum transaction: Exactly 5000 INR is valid
- Maximum transaction: Exactly 500000 INR is valid
- Zero amount: Invalid, rejected with error
- Negative amount: Invalid, rejected with error

**Missing Data:**
- CURRENCIES object missing a currency: Throws error immediately
- FOREX_CONFIG missing a property: Validation catches and rejects
- forex_details null in database: Normal for non-forex quotes

## Testing Strategy

### Overview

The forex counter feature uses a **dual testing approach**:
1. **Unit tests**: Specific examples, edge cases, and component behavior
2. **Property-based tests**: Universal properties across randomized inputs

This strategy balances thorough input coverage (property tests) with concrete behavior verification (unit tests).

### Property-Based Testing

**Library**: fast-check (https://github.com/dubzzz/fast-check)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: forex-counter, Property {N}: {property description}`

**Test File**: `tests/forex.test.js`

**Example Property Test:**
```javascript
import fc from "fast-check";
import test from "node:test";
import assert from "node:assert/strict";
import { calculateForexBuyRate } from "../lib/logic.js";
import { CURRENCIES, FOREX_CURRENCIES, FOREX_CONFIG } from "../lib/data.js";

test("Property 1: Buy rate formula and invariant", () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...FOREX_CURRENCIES),
      fc.record({
        buyMarginPercent: fc.float({ min: 0.1, max: 20, noNaN: true }),
        sellMarginPercent: fc.float({ min: 0.1, max: 20, noNaN: true }),
        minTransactionINR: fc.constant(5000),
        maxTransactionINR: fc.constant(500000),
        serviceFeePercent: fc.constant(0)
      }),
      (currency, config) => {
        const baseRate = CURRENCIES[currency].rate;
        const buyRate = calculateForexBuyRate("INR", currency, CURRENCIES, config);
        const expectedRate = baseRate * (1 + config.buyMarginPercent / 100);
        
        const formulaCorrect = Math.abs(buyRate - expectedRate) < 0.0000001;
        const invariantHolds = buyRate > baseRate;
        
        return formulaCorrect && invariantHolds;
      }
    ),
    { numRuns: 100 }  // Minimum 100 iterations
  );
});
```

**Coverage**:
- 9 comprehensive properties (see Correctness Properties section)
- All covering critical calculation and validation logic
- Testing across full input space, not just happy paths

### Unit Testing

**Library**: Node.js built-in test runner

**Test File**: `tests/forex.test.js` (same file as property tests)

**Coverage**:

1. **Configuration Tests** (Requirements 1.1-1.9):
   - FOREX_CURRENCIES array contains expected currency codes
   - FOREX_CONFIG has all required properties with correct initial values
   - Forex service exists in SERVICES array with correct properties
   - "Forex" exists in QUOTE_SERVICE_OPTIONS

2. **Calculation Function Tests** (Requirements 2.1-2.11):
   - Functions exist and are exported
   - Buy rate calculation with USD example
   - Sell rate calculation with USD example
   - Buy quote calculation with specific values
   - Sell quote calculation with specific values
   - Unsupported currency throws error
   - Non-INR base throws error
   - Below minimum amount throws error
   - Above maximum amount throws error

3. **Validation Function Tests** (Requirements 7.1-7.9):
   - validateForexConfig exists
   - FOREX_CONFIG passes validation
   - Invalid config examples fail validation
   - validateForexQuoteRequest exists
   - Valid request examples pass validation
   - Invalid request examples fail validation

**Example Unit Test:**
```javascript
test("calculateForexBuyRate with USD returns expected value", () => {
  const buyRate = calculateForexBuyRate("INR", "USD", CURRENCIES, FOREX_CONFIG);
  const baseRate = CURRENCIES.USD.rate;  // 0.012
  const expected = baseRate * 1.025;      // 0.0123
  
  assert.ok(Math.abs(buyRate - expected) < 0.0000001);
});

test("unsupported currency throws error", () => {
  assert.throws(
    () => calculateForexBuyRate("INR", "XXX", CURRENCIES, FOREX_CONFIG),
    /Unsupported currency/
  );
});
```

### Component Testing

**Not included in initial implementation**. Component tests would require:
- React Testing Library or similar
- JSDOM or browser environment
- Mock setup for context providers (CurrencyProvider, QuoteIntentProvider, ModalProvider)

**Recommended for future**:
- ForexCalculator render and interaction tests
- ForexSection render tests
- QuoteForm forex field conditional rendering tests
- Accessibility compliance tests (axe-core)

### Integration Testing

**Scope**: Full request-response cycle for forex quotes

**Test Scenarios**:
1. Submit valid forex buy quote request → stored in database with correct structure
2. Submit valid forex sell quote request → stored in database
3. Submit invalid forex quote request → returns 400 with validation errors
4. Retrieve forex quote from admin panel → displays correctly formatted

**Not included in initial scope**. Requires:
- Test database setup
- API route testing (Next.js API testing utilities)
- Database seeding and cleanup
- Mock email/notification services

### Test Execution

**Command**: `node --test "tests/**/*.test.js"`

**Exit Codes**:
- 0: All tests passed
- Non-zero: One or more tests failed

**CI/CD Integration**:
- Run on every pull request
- Block merge if tests fail
- Report coverage metrics (optional, requires c8 or similar)

### Test Organization

```
tests/
  forex.test.js          # All forex tests (property + unit + integration)
  
Structure within forex.test.js:
  1. Imports
  2. Configuration tests (unit)
  3. Calculation function tests (unit + property)
  4. Validation function tests (unit + property)
  5. Property tests (remaining properties)
```

**Tag Format for Property Tests**:
```javascript
test("Feature: forex-counter, Property 1: Buy rate formula and invariant", () => {
  // property test implementation
});
```

This format allows filtering tests by feature or property number.

### Coverage Goals

**Target**: 95%+ coverage of logic module functions
- All calculation functions: 100% coverage
- All validation functions: 100% coverage
- Error branches: 100% coverage
- Edge cases: Covered by property tests

**Not Covered by Automated Tests**:
- UI rendering details (visual testing)
- Responsive layout (visual regression testing)
- Cross-browser compatibility (manual testing)
- Admin panel display (integration testing)

## Implementation Notes

### Development Order

1. **Data Layer** (lib/data.js):
   - Add FOREX_CURRENCIES constant
   - Add FOREX_CONFIG constant
   - Add forex service to SERVICES array
   - Add "Forex" to QUOTE_SERVICE_OPTIONS

2. **Logic Layer** (lib/logic.js):
   - Implement calculateForexBuyRate
   - Implement calculateForexSellRate
   - Implement calculateForexQuote
   - Implement validateForexConfig
   - Implement validateForexQuoteRequest

3. **Write Tests** (tests/forex.test.js):
   - Configuration tests
   - Unit tests for calculations
   - Property-based tests for all properties
   - Validation tests

4. **Calculator Component** (components/client/ForexCalculator.jsx):
   - Direction toggle
   - Currency selector
   - Amount input
   - Result display
   - Error handling
   - Get Quote button integration

5. **Section Component** (components/sections/ForexSection.jsx):
   - Section structure
   - Heading and lead text
   - Calculator integration
   - Supported currencies list
   - Styling

6. **Quote Form Extension** (components/client/QuoteForm.jsx):
   - Add forex fields to form state
   - Conditional field rendering
   - Validation integration
   - Payload construction

7. **API Extension** (app/api/quote/route.js):
   - Forex validation in API
   - Database insertion with forex_details

8. **Admin Panel Extension**:
   - Database migration for forex_details column
   - Forex badge in leads table
   - Forex details display

9. **Page Integration** (app/(site)/page.js):
   - Add ForexSection between Services and Destinations

### Dependencies

**New**:
- fast-check: `npm install --save-dev fast-check`

**Existing** (no changes needed):
- Next.js 14
- React 18
- PostgreSQL client (already in use)
- Node.js test runner (built-in)

### Database Migration

```sql
-- Add forex_details column to leads table
ALTER TABLE leads 
ADD COLUMN forex_details JSONB DEFAULT NULL;

-- Add index for efficient forex quote queries
CREATE INDEX idx_leads_forex_services 
ON leads USING GIN (services);

-- Add check constraint to ensure forex_details structure
ALTER TABLE leads
ADD CONSTRAINT check_forex_details
CHECK (
  forex_details IS NULL OR (
    forex_details ? 'direction' AND
    forex_details ? 'currency' AND
    forex_details ? 'amount' AND
    forex_details->>'direction' IN ('buy', 'sell') AND
    jsonb_typeof(forex_details->'amount') = 'number'
  )
);
```

### Performance Considerations

**Calculation Performance**:
- All calculations are synchronous, in-memory operations
- No API calls or database queries in calculation path
- Expected latency: < 1ms per calculation
- Debouncing (300ms) prevents excessive re-calculations

**Database Impact**:
- JSONB column adds minimal overhead
- GIN index on services array enables fast forex quote filtering
- No additional tables or joins required

**Client Bundle Size**:
- ForexCalculator: ~3-5 KB (estimated)
- Logic functions tree-shaken (only used functions included)
- No heavy dependencies added

### Security Considerations

**Input Validation**:
- All inputs validated on client and server
- Type checking on all numeric inputs
- Range validation prevents DoS via extreme values
- Currency codes validated against whitelist

**Calculation Safety**:
- Pure functions prevent side effects
- No eval() or dynamic code execution
- Floating point operations use safe rounding
- Integer overflow prevented by range limits

**Data Storage**:
- forex_details stored as JSONB (type-safe)
- Check constraint prevents invalid JSON structure
- No PII in forex_details (amount, currency, direction only)
- Standard SQL injection protection (parameterized queries)

### Accessibility Compliance

**WCAG 2.1 Level AA**:
- All form controls have associated labels
- Error messages announced to screen readers
- Keyboard navigation fully supported
- Focus indicators visible on all interactive elements
- Color contrast meets 4.5:1 minimum
- Touch targets minimum 44×44 pixels

**Screen Reader Support**:
- Direction toggle uses role="radiogroup"
- Result updates announced via aria-live="polite"
- Error messages associated with inputs via aria-describedby
- Button text descriptive ("Get formal quote to buy USD" not just "Get Quote")

**Keyboard Navigation**:
- Tab order: Direction → Currency → Amount → Button
- Space/Enter activates radio buttons and button
- Arrow keys navigate radio options
- No keyboard traps

### Browser Support

**Minimum Supported**:
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile browsers: iOS Safari 14+, Chrome Android 90+

**Polyfills Not Required**:
- All JavaScript features are ES2020 or earlier
- CSS uses standard properties (no experimental features)
- No browser-specific APIs used

### Future Enhancements

**Potential Additions** (not in current scope):
1. Historical rate tracking and display
2. Rate alerts (notify when rate reaches target)
3. Multiple currency exchange in single transaction
4. Integration with live forex rate APIs
5. Downloadable rate comparison chart
6. Forex service booking with advance payment
7. Admin panel to update margins without code changes
8. Customer dashboard to track quote history
9. Email confirmation with current rates
10. SMS rate notifications

**Technical Debt to Address**:
- Component tests for ForexCalculator and ForexSection
- Integration tests for full quote submission flow
- Visual regression tests for responsive layouts
- Performance monitoring for calculation operations
- A/B testing infrastructure for conversion optimization

---

## Summary

The Forex Counter feature extends Travel Guru Raipur's website with foreign exchange services through:

1. **Configuration-driven design**: All business parameters in data.js
2. **Pure functional core**: Testable calculation and validation logic
3. **Integrated UX**: Leverages existing quote form and modal infrastructure
4. **Comprehensive testing**: 9 property-based tests + unit tests covering all critical paths
5. **Accessibility compliant**: WCAG 2.1 AA with full keyboard and screen reader support

The implementation follows established patterns in the codebase, requires minimal new dependencies (only fast-check for testing), and integrates seamlessly with existing features. All rate calculations are deterministic, testable, and validated at multiple layers (client, API, database).

