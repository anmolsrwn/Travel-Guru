# Requirements Document

## Introduction

This document specifies the requirements for the **Forex Counter** feature for Travel Guru Raipur. The feature adds foreign exchange services to the travel agency's service offerings, allowing visitors to inquire about currency exchange rates and services. The forex counter extends the existing services architecture by adding forex as a bookable service alongside flights, hotels, visa, and other travel services. It leverages the existing currency data infrastructure (`CURRENCIES` in `lib/data.js` and `CurrencyProvider.jsx`) while adding forex-specific business logic for exchange rates, service fees, and quote generation.

This spec extends the main Travel Guru Raipur spec (`travel-agency-website/requirements.md`). Requirement IDs here use the prefix **FX** to avoid conflict with existing requirement series. All vocabulary from the main spec Glossary carries over unchanged.

## Glossary

- **Forex_Service**: The foreign exchange service offered by Travel Guru Raipur, allowing customers to buy or sell foreign currency
- **Forex_Counter**: The service interface for currency exchange, encompassing both the UI components and the backend quote logic
- **Exchange_Rate**: The rate at which one currency can be exchanged for another, expressed as units of target currency per 1 unit of source currency
- **Forex_Quote**: A time-limited quotation for a currency exchange transaction, containing source currency, target currency, amount, exchange rate, service fee, and total payable
- **Service_Fee**: The commission charged by Travel Guru Raipur for forex transactions, calculated as a percentage of the transaction amount
- **Buy_Rate**: The rate at which Travel Guru Raipur sells foreign currency to customers (customer buys foreign currency, pays in INR)
- **Sell_Rate**: The rate at which Travel Guru Raipur buys foreign currency from customers (customer sells foreign currency, receives INR)
- **Forex_Calculator**: A client component that allows visitors to calculate forex exchange amounts in real-time before submitting a formal quote request
- **Supported_Forex_Currency**: A currency that Travel Guru Raipur supports for forex exchange transactions (subset of display currencies)

## Requirements

### Requirement 1: Forex Service Data Configuration

**User Story:** As a developer, I want forex service configuration data in `lib/data.js`, so that forex rates, fees, and supported currencies are defined in one place and can be updated without code changes.

#### Acceptance Criteria

1. THE Data_Config SHALL export a constant `FOREX_CURRENCIES` as an array of currency codes that are supported for forex exchange, with initial value `["USD", "EUR", "GBP", "AUD", "AED", "SGD"]` (excludes INR from the CURRENCIES list).
2. THE Data_Config SHALL export a constant `FOREX_CONFIG` object containing `buyMarginPercent`, `sellMarginPercent`, `minTransactionINR`, `maxTransactionINR`, and `serviceFeePercent` properties.
3. THE `FOREX_CONFIG.buyMarginPercent` property SHALL have an initial value of 2.5, representing the percentage markup applied to base currency rates when customers buy foreign currency.
4. THE `FOREX_CONFIG.sellMarginPercent` property SHALL have an initial value of 3.0, representing the percentage markdown applied to base currency rates when customers sell foreign currency.
5. THE `FOREX_CONFIG.minTransactionINR` property SHALL have an initial value of 5000, representing the minimum forex transaction amount in INR equivalent.
6. THE `FOREX_CONFIG.maxTransactionINR` property SHALL have an initial value of 500000, representing the maximum forex transaction amount in INR equivalent.
7. THE `FOREX_CONFIG.serviceFeePercent` property SHALL have an initial value of 0, representing no additional service fee beyond the buy/sell margin.
8. THE Data_Config SHALL add a forex service entry to the `SERVICES` array with `id: "forex"`, `icon: "currency"`, `title: "Forex"`, `subtitle: "Currency Exchange Services"`, and `quoteOption: "Forex"`.
9. THE Data_Config SHALL add "Forex" to the `QUOTE_SERVICE_OPTIONS` array.

### Requirement 2: Forex Rate Calculation Logic

**User Story:** As a developer, I want pure functions in `lib/logic.js` that calculate buy and sell rates with margins applied, so that forex rate calculations are testable and consistent across all components.

#### Acceptance Criteria

1. THE Logic_Module SHALL export a function `calculateForexBuyRate(baseCurrency, targetCurrency, currencies, forexConfig)` that returns the rate at which a customer buys `targetCurrency` by paying in `baseCurrency`.
2. WHEN `calculateForexBuyRate` is called with valid currency codes present in `currencies`, THE Logic_Module SHALL return the base rate from `currencies[targetCurrency].rate` multiplied by `(1 + forexConfig.buyMarginPercent / 100)`.
3. THE Logic_Module SHALL export a function `calculateForexSellRate(baseCurrency, targetCurrency, currencies, forexConfig)` that returns the rate at which a customer sells `targetCurrency` to receive `baseCurrency`.
4. WHEN `calculateForexSellRate` is called with valid currency codes, THE Logic_Module SHALL return the base rate from `currencies[targetCurrency].rate` multiplied by `(1 - forexConfig.sellMarginPercent / 100)`.
5. IF either `calculateForexBuyRate` or `calculateForexSellRate` is called with a `targetCurrency` not present in the `currencies` object, THEN THE Logic_Module SHALL throw an error with message "Unsupported currency".
6. IF either function is called with `baseCurrency` not equal to "INR", THEN THE Logic_Module SHALL throw an error with message "Base currency must be INR".
7. THE Logic_Module SHALL export a function `calculateForexQuote(direction, sourceCurrency, targetCurrency, amount, currencies, forexConfig)` where `direction` is either "buy" or "sell".
8. WHEN `calculateForexQuote` is called with `direction: "buy"`, THE Logic_Module SHALL return an object containing `sourceAmount` (INR amount customer pays), `targetAmount` (foreign currency amount customer receives), `rate` (buy rate used), `serviceFee` (INR), and `totalINR` (sourceAmount plus serviceFee).
9. WHEN `calculateForexQuote` is called with `direction: "sell"`, THE Logic_Module SHALL return an object containing `sourceAmount` (foreign currency amount customer provides), `targetAmount` (INR amount customer receives), `rate` (sell rate used), `serviceFee` (INR), and `totalINR` (targetAmount minus serviceFee).
10. WHEN calculating a forex quote, THE Logic_Module SHALL calculate `serviceFee` as `sourceAmount * (forexConfig.serviceFeePercent / 100)` for buy transactions and `targetAmount * (forexConfig.serviceFeePercent / 100)` for sell transactions.
11. IF `calculateForexQuote` is called with an `amount` less than `forexConfig.minTransactionINR` INR equivalent or greater than `forexConfig.maxTransactionINR` INR equivalent, THEN THE Logic_Module SHALL throw an error with message "Amount outside allowed range".

### Requirement 3: Forex Calculator Component

**User Story:** As a Visitor, I want to use a forex calculator to see exchange rates and calculate currency amounts before requesting a formal quote, so that I can understand the cost and make informed decisions.

#### Acceptance Criteria

1. THE Forex_Calculator SHALL be implemented as a client component at `components/client/ForexCalculator.jsx` that renders a form with direction selector, currency selectors, amount input, and calculated result display.
2. THE Forex_Calculator SHALL render a direction toggle with two options: "Buy Foreign Currency" and "Sell Foreign Currency", with "Buy Foreign Currency" selected by default.
3. WHEN the direction is "Buy Foreign Currency", THE Forex_Calculator SHALL display inputs for "I want to buy" (currency selector from FOREX_CURRENCIES) and "Amount" (number input in selected foreign currency).
4. WHEN the direction is "Sell Foreign Currency", THE Forex_Calculator SHALL display inputs for "I want to sell" (currency selector from FOREX_CURRENCIES) and "Amount" (number input in selected foreign currency).
5. THE Forex_Calculator SHALL display the calculated result showing the INR equivalent, exchange rate used, service fee (if non-zero), and total INR payable or receivable.
6. WHEN a Visitor changes the amount, currency, or direction, THE Forex_Calculator SHALL recalculate and update the displayed result within 300ms using `calculateForexQuote` from the Logic_Module.
7. THE Forex_Calculator SHALL validate that the amount is numeric, non-negative, and within the allowed transaction range, displaying an error message "Amount must be between ₹5,000 and ₹5,00,000 equivalent" if validation fails.
8. THE Forex_Calculator SHALL format all currency amounts using `formatPrice` from the Logic_Module with appropriate currency symbols and decimal places.
9. THE Forex_Calculator SHALL display a disclaimer text "Rates are indicative and subject to change. Final rates will be confirmed in your quote." below the calculation result.
10. THE Forex_Calculator SHALL include a "Get Formal Quote" button that, WHEN clicked, opens the quote form modal with the forex service pre-selected and the amount pre-filled in the notes field.

### Requirement 4: Forex Service Section

**User Story:** As a Visitor, I want a dedicated forex service section on the homepage, so that I can discover the forex services offered and access the forex calculator.

#### Acceptance Criteria

1. THE Forex_Section SHALL be implemented as a server component at `components/sections/ForexSection.jsx` that renders between the Services_Section and the Destinations_Section.
2. THE Forex_Section SHALL render an eyebrow element containing the text "Forex Counter".
3. THE Forex_Section SHALL render an H2 heading "Exchange Foreign Currency with Confidence" with the word "Confidence" wrapped in a `--brand-grad` gradient-text element.
4. THE Forex_Section SHALL render a lead paragraph explaining the forex service: "Travel Guru Raipur offers competitive foreign exchange rates for major currencies. Calculate rates instantly and get a formal quote within 24 hours."
5. THE Forex_Section SHALL render the Forex_Calculator component as a child.
6. THE Forex_Section SHALL display a list of supported currencies using the `FOREX_CURRENCIES` array, showing currency codes with their symbols from the `CURRENCIES` object.
7. THE Forex_Section SHALL apply the alternating section background pattern consistent with other page sections.
8. THE Forex_Section SHALL apply the scroll-reveal entrance animation via the existing `Reveal` component.

### Requirement 5: Forex Quote Request Integration

**User Story:** As a Visitor, I want to request a formal forex quote through the existing quote form, so that I can receive personalized rates and service details from Travel Guru Raipur.

#### Acceptance Criteria

1. WHEN a Visitor selects "Forex" in the quote form's service options, THE Quote_Form SHALL display additional forex-specific fields: "Direction" (Buy/Sell toggle), "Currency" (select from FOREX_CURRENCIES), and "Amount" (number input).
2. THE Quote_Form SHALL validate that WHEN "Forex" is selected, the forex-specific fields (direction, currency, amount) are all provided and valid before allowing form submission.
3. WHEN the quote form is submitted with "Forex" selected, THE App_Layer SHALL include the forex details in the quote request payload sent to `/api/quote`: `{ services: ["Forex"], forexDetails: { direction, currency, amount } }`.
4. THE Quote_API SHALL validate forex quote requests to ensure `forexDetails.direction` is either "buy" or "sell", `forexDetails.currency` is in FOREX_CURRENCIES, and `forexDetails.amount` is within the allowed range.
5. THE Quote_API SHALL store forex quote requests in the database with all forex details preserved in a `forex_details` JSONB column.
6. THE Admin_Panel SHALL display forex quote requests in the leads table with a "Forex" badge and SHALL show the forex details (direction, currency, amount) in the lead detail view.

### Requirement 6: Forex Rate Display in Services List

**User Story:** As a Visitor browsing the services section, I want to see that forex services are available, so that I can understand the full range of services offered by Travel Guru Raipur.

#### Acceptance Criteria

1. THE Services_Section SHALL render the forex service card with icon, title, subtitle, and a brief summary from the SERVICES array.
2. THE forex service card SHALL display "Competitive exchange rates for international travel" as the summary text.
3. THE forex service card SHALL display bullet points: "USD, EUR, GBP, AUD, AED, SGD", "Buy and sell foreign currency", "Formal quotes within 24 hours".
4. THE forex service card SHALL link to `#forex-counter` (the Forex_Section anchor), allowing visitors to navigate directly to the forex calculator.
5. WHEN "Forex" is selected in the quote form service options, THE Quote_Form SHALL display the forex option with the same icon and color scheme used in the Services_Section forex card.

### Requirement 7: Forex Logic Validation

**User Story:** As a developer, I want validation functions for forex configuration and quote data, so that invalid forex transactions are caught before reaching production.

#### Acceptance Criteria

1. THE Logic_Module SHALL export a function `validateForexConfig(config)` that returns `{ valid: true }` if the config has all required numeric properties with sensible values, or `{ valid: false, errors: {...} }` otherwise.
2. WHEN `validateForexConfig` is called with a config where `buyMarginPercent` or `sellMarginPercent` is negative or greater than 20, THE Validator SHALL return `valid: false` with a margin error.
3. WHEN `validateForexConfig` is called with a config where `minTransactionINR` is less than 1000 or greater than `maxTransactionINR`, THE Validator SHALL return `valid: false` with a transaction limit error.
4. THE Logic_Module SHALL export a function `validateForexQuoteRequest(request, forexConfig, forexCurrencies)` that validates a forex quote request object.
5. WHEN `validateForexQuoteRequest` is called with a valid request containing `direction`, `currency`, and `amount`, THE Validator SHALL return `{ valid: true, errors: {} }`.
6. IF `validateForexQuoteRequest` is called with a request where `direction` is not "buy" or "sell", THEN THE Validator SHALL return `valid: false` with a direction error.
7. IF `validateForexQuoteRequest` is called with a request where `currency` is not in the `forexCurrencies` array, THEN THE Validator SHALL return `valid: false` with a currency error.
8. IF `validateForexQuoteRequest` is called with a request where `amount` is not a positive number, THEN THE Validator SHALL return `valid: false` with an amount error.
9. WHEN `validateForexConfig` is called with the `FOREX_CONFIG` constant from `lib/data.js`, THE Validator SHALL return `{ valid: true, errors: {} }`.

### Requirement 8: Forex Calculator Accessibility

**User Story:** As a Visitor using assistive technology, I want the forex calculator to be fully accessible, so that I can calculate exchange rates and request quotes independently.

#### Acceptance Criteria

1. THE Forex_Calculator direction toggle SHALL be implemented as a `role="radiogroup"` with two `role="radio"` options, each properly labeled and associated with their selection state.
2. THE Forex_Calculator currency selector SHALL be implemented as a native `<select>` element with a visible `<label>` element associated via `for`/`id` attributes.
3. THE Forex_Calculator amount input SHALL be implemented as `<input type="number">` with a visible label, `aria-describedby` pointing to any validation error message, and `aria-invalid="true"` when validation fails.
4. WHEN the calculated result updates, THE Forex_Calculator SHALL announce the new result to screen readers using an `aria-live="polite"` region containing the formatted result text.
5. THE "Get Formal Quote" button SHALL have descriptive text that includes the direction and currency, for example "Get formal quote to buy USD".
6. THE Forex_Calculator SHALL be fully keyboard navigable with logical tab order: direction toggle → currency selector → amount input → Get Formal Quote button.
7. WHEN focus moves to the currency selector, THE Forex_Calculator SHALL ensure the selected currency option is visible without requiring the user to scroll within the dropdown.

### Requirement 9: Forex Tests

**User Story:** As a developer, I want comprehensive tests for forex calculation logic, so that I can verify rate calculations, quote generation, and validation are correct.

#### Acceptance Criteria

1. THE Test_Suite SHALL include a test file `tests/forex.test.js` that imports forex functions from `lib/logic.js` and forex config from `lib/data.js`, and runs under `node --test "tests/**/*.test.js"`.
2. THE test file SHALL include example-based tests for:
   - `calculateForexBuyRate("INR", "USD", CURRENCIES, FOREX_CONFIG)` returns base USD rate multiplied by 1.025
   - `calculateForexSellRate("INR", "USD", CURRENCIES, FOREX_CONFIG)` returns base USD rate multiplied by 0.97
   - `calculateForexQuote("buy", "INR", "USD", 10000, CURRENCIES, FOREX_CONFIG)` returns a quote with correct sourceAmount, targetAmount, rate, and totalINR
   - `calculateForexQuote("sell", "USD", "INR", 100, CURRENCIES, FOREX_CONFIG)` returns a quote with correct amounts
   - Invalid currency codes throw "Unsupported currency" error
   - Non-INR base currency throws "Base currency must be INR" error
   - Amount below minimum throws "Amount outside allowed range" error
   - Amount above maximum throws "Amount outside allowed range" error
   - `validateForexConfig(FOREX_CONFIG)` returns `{ valid: true }`
   - `validateForexQuoteRequest({ direction: "buy", currency: "USD", amount: 10000 }, FOREX_CONFIG, FOREX_CURRENCIES)` returns `{ valid: true }`
3. THE test file SHALL include the following property-based tests using fast-check with at least 100 runs each:
   - **Property 9.P1 — Buy rate is always higher than base rate**: For any valid forex currency, `calculateForexBuyRate` SHALL return a value greater than the base rate in CURRENCIES.
   - **Property 9.P2 — Sell rate is always lower than base rate**: For any valid forex currency, `calculateForexSellRate` SHALL return a value less than the base rate in CURRENCIES.
   - **Property 9.P3 — Buy-sell spread is positive**: For any valid forex currency, `calculateForexBuyRate` minus `calculateForexSellRate` SHALL be greater than zero.
   - **Property 9.P4 — Quote amounts are proportional**: For any valid buy quote, doubling the input amount SHALL double the sourceAmount and targetAmount (within rounding tolerance of 0.01).
   - **Property 9.P5 — Round-trip loses value**: For any amount, calculating a buy quote then a sell quote with the received foreign currency SHALL result in receiving less INR than the original amount (due to spread).
4. THE Test_Suite SHALL exit with code 0 after all forex tests pass, and SHALL exit with a non-zero code if any test fails.

### Requirement 10: Forex Section Mobile Responsiveness

**User Story:** As a Visitor on a mobile device, I want the forex calculator to be usable and readable on small screens, so that I can calculate rates on my phone.

#### Acceptance Criteria

1. WHILE the viewport is a Mobile_Viewport, THE Forex_Calculator SHALL arrange all form controls in a single column layout with full-width inputs.
2. WHILE the viewport is a Mobile_Viewport, THE Forex_Calculator direction toggle SHALL wrap to multiple lines if needed to prevent horizontal overflow.
3. WHILE the viewport is a Mobile_Viewport, THE Forex_Calculator result display SHALL use a font size no smaller than 16px to prevent browser zoom on focus.
4. WHILE the viewport is a Desktop_Viewport or Wide_Viewport, THE Forex_Calculator SHALL arrange the form in a two-column layout with inputs on the left and results on the right.
5. THE Forex_Calculator number input SHALL have `inputmode="decimal"` to trigger the numeric keyboard on mobile devices.
6. THE Forex_Section SHALL maintain readability and proper spacing across all viewport sizes defined in the design system (Mobile, Tablet, Desktop, Wide).

