// Example tests for validateEmail, validatePhone, validateQuoteForm and validateCheckout.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BUSINESS } from "../lib/data.js";
import * as L from "../lib/logic.js";

const TODAY = "2026-03-10";

const validQuote = () => ({
  services: ["Flights", "Hotels"],
  departureCity: "Raipur",
  destinations: "Bali",
  departureDate: "2026-03-11",
  duration: "5-7 days",
  tripType: "Family",
  adults: 2,
  children: 1,
  childAges: "6",
  hotelCategory: "4★",
  mealPlan: "Any",
  budget: "Premium",
  fullName: "Asha Verma",
  phone: "+91 98765-43210",
  email: "asha@example.com",
  callbackSlot: "morning",
  notes: "Vegetarian meals",
});

const PKG = {
  id: "test-pkg",
  tiers: [
    { id: "deluxe", adultPriceINR: 50000, childPriceINR: 30000 },
    { id: "premium", adultPriceINR: 70000, childPriceINR: null },
  ],
};

const validCheckout = () => ({
  tierId: "deluxe",
  adults: 2,
  children: 1,
  travelDate: "2026-03-11",
  leadName: "Asha Verma",
  email: "asha@example.com",
  phone: "9876543210",
  agreeTerms: true,
});

const keys = (r) => Object.keys(r.errors).sort();

test("validateEmail: accepts plain addresses, rejects whitespace, missing @ and non-strings", () => {
  for (const ok of ["a@b.co", "first.last+tag@mail.example.org"]) assert.equal(L.validateEmail(ok), true, ok);
  for (const bad of ["", "a@b.c", "a b@c.com", "a@@b.com", "a@b", "@b.com", " a@b.com", "a@b.com\n"]) {
    assert.equal(L.validateEmail(bad), false, JSON.stringify(bad));
  }
  for (const bad of [undefined, null, 5, {}, ["a@b.co"]]) assert.equal(L.validateEmail(bad), false);
});

test("validatePhone: 8–15 digits, optional +, separators ignored", () => {
  for (const ok of ["98765432", "+919876543210", "+91 (98765) 43-210", "123456789012345"]) {
    assert.equal(L.validatePhone(ok), true, ok);
  }
  for (const bad of ["", "1234567", "1234567890123456", "98765abc10", "++919876543210", "91+9876543210", "９８７６５４３２"]) {
    assert.equal(L.validatePhone(bad), false, bad);
  }
  for (const bad of [undefined, null, 9876543210, {}]) assert.equal(L.validatePhone(bad), false);
});

test("validateQuoteForm: valid data passes in both modes", () => {
  assert.deepEqual(L.validateQuoteForm(validQuote(), TODAY), { valid: true, errors: {} });
  assert.deepEqual(L.validateQuoteForm(validQuote(), TODAY, { mode: "whatsapp" }), { valid: true, errors: {} });
});

test("validateQuoteForm: missing fields use defaults and never throw", () => {
  const r = L.validateQuoteForm({}, TODAY);
  assert.equal(r.valid, false);
  assert.deepEqual(keys(r), ["departureDate", "destinations", "email", "fullName", "phone", "services"]);
  assert.doesNotThrow(() => L.validateQuoteForm(undefined, undefined, undefined));
  assert.doesNotThrow(() => L.validateQuoteForm(null, "bad-date", null));
  // Bad todayISO: date cannot be checked, so departureDate fails instead of throwing.
  assert.deepEqual(keys(L.validateQuoteForm(validQuote(), "not-a-date")), ["departureDate"]);
});

test("validateQuoteForm: WhatsApp mode is lenient on empty email, date and destinations", () => {
  const minimal = { services: ["Visa"], fullName: "Ravi", phone: "9876543210" };
  assert.equal(L.validateQuoteForm(minimal, TODAY, { mode: "whatsapp" }).valid, true);
  assert.deepEqual(keys(L.validateQuoteForm({ ...minimal, email: "nope" }, TODAY, { mode: "whatsapp" })), ["email"]);
  assert.deepEqual(
    keys(L.validateQuoteForm({ ...minimal, departureDate: TODAY }, TODAY, { mode: "whatsapp" })),
    ["departureDate"],
  );
});

test("validateQuoteForm: each corruption adds exactly its key", () => {
  const cases = {
    services: [[], ["Cruise"], "Flights", [...Array(10)].map(() => "Flights")],
    fullName: ["A", " A ", "x".repeat(81), 42],
    phone: ["123", "9".repeat(10) + " ".repeat(11), null],
    adults: [0, 13, 2.5, "2"],
    children: [-1, 9, 1.5],
    childAges: ["x".repeat(101), 6],
    departureCity: ["x".repeat(81), 1],
    destinations: ["x".repeat(201), "   ", 7],
    email: ["", "bad", `${"a".repeat(246)}@mail.com`],
    departureDate: ["", TODAY, "2026-02-30", "11/03/2026"],
    duration: ["2 days", 5],
    tripType: ["Business"],
    hotelCategory: ["6★"],
    mealPlan: ["Lunch"],
    budget: ["Cheap"],
    callbackSlot: ["Morning (9:00 AM – 12:00 PM)", "night"],
    notes: ["x".repeat(1001)],
  };
  for (const [field, values] of Object.entries(cases)) {
    for (const v of values) {
      const r = L.validateQuoteForm({ ...validQuote(), [field]: v }, TODAY);
      assert.equal(r.valid, false, `${field}=${JSON.stringify(v)}`);
      assert.deepEqual(keys(r), [field], `${field}=${JSON.stringify(v)}`);
    }
  }
});

test("validateQuoteForm: boundary lengths are accepted", () => {
  const r = L.validateQuoteForm(
    {
      ...validQuote(),
      fullName: "Al",
      childAges: "x".repeat(100),
      notes: "x".repeat(1000),
      departureCity: "x".repeat(80),
      destinations: "x".repeat(200),
      email: `${"a".repeat(245)}@mail.com`,
      adults: 12,
      children: 8,
      services: [...Array(7)].map(() => "Hotels"),
    },
    TODAY,
  );
  assert.deepEqual(r, { valid: true, errors: {} });
  assert.equal(BUSINESS.originCity.name.length <= 80, true);
});

test("validateCheckout: valid data passes; extra and card keys are ignored", () => {
  assert.deepEqual(L.validateCheckout(validCheckout(), TODAY, PKG), { valid: true, errors: {} });
  const extra = { ...validCheckout(), cardNumber: "x", expiry: "00/00", cvc: "", totalINR: 1 };
  assert.deepEqual(L.validateCheckout(extra, TODAY, PKG), { valid: true, errors: {} });
});

test("validateCheckout: each corruption adds exactly its key", () => {
  const cases = {
    tierId: ["superior", undefined, 1],
    adults: [0, 13, 1.5],
    children: [-1, 9, "1"],
    travelDate: [TODAY, "", "2026-13-01"],
    leadName: ["A", "x".repeat(81), undefined],
    email: ["bad", `${"a".repeat(246)}@mail.com`],
    phone: ["123", "9".repeat(10) + "-".repeat(11)],
    agreeTerms: [false, "true", undefined],
  };
  for (const [field, values] of Object.entries(cases)) {
    for (const v of values) {
      const r = L.validateCheckout({ ...validCheckout(), [field]: v }, TODAY, PKG);
      assert.deepEqual(keys(r), [field], `${field}=${JSON.stringify(v)}`);
      assert.equal(r.valid, false);
    }
  }
  const terms = L.validateCheckout({ ...validCheckout(), agreeTerms: false }, TODAY, PKG);
  assert.equal(terms.errors.agreeTerms, "Please accept the Terms & Cancellation Policy");
});

test("validateCheckout: children must be 0 for a tier without child price", () => {
  const base = { ...validCheckout(), tierId: "premium" };
  assert.deepEqual(keys(L.validateCheckout(base, TODAY, PKG)), ["children"]);
  assert.equal(L.validateCheckout({ ...base, children: 0 }, TODAY, PKG).valid, true);
});

test("validateCheckout: never throws on missing data or package", () => {
  for (const [d, t, p] of [[undefined, undefined, undefined], [null, TODAY, null], [{}, "x", { tiers: "no" }]]) {
    const r = L.validateCheckout(d, t, p);
    assert.equal(r.valid, false);
    assert.ok("tierId" in r.errors && "agreeTerms" in r.errors);
  }
});
