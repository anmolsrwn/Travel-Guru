// Example tests for the WhatsApp composers and URL builder.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BUSINESS, CURRENCIES, PACKAGES } from "../lib/data.js";
import * as L from "../lib/logic.js";

const fullQuote = {
  services: ["Holiday Package", "Flights"],
  departureCity: "Raipur",
  destinations: "Bali",
  departureDate: "2026-12-01",
  duration: "5-7 nights",
  tripType: "Honeymoon",
  adults: 2,
  children: 1,
  childAges: "6",
  hotelCategory: "4 Star",
  mealPlan: "Breakfast",
  budget: "₹1–2 Lakh",
  fullName: "  Asha Verma ",
  phone: "+91 98765 43210",
  email: "asha@example.com",
  callbackSlot: "morning",
  notes: "Pool villa & sunset dinner #1",
};

test("composeQuoteWhatsAppMessage: header, order, labels, slot label, children ages", () => {
  const msg = L.composeQuoteWhatsAppMessage(fullQuote, BUSINESS);
  const lines = msg.split("\n");
  assert.ok(lines[0].includes(BUSINESS.brandName));
  assert.equal(lines[1], "");
  assert.deepEqual(lines.slice(2), [
    "*Services:* Holiday Package, Flights",
    "*From:* Raipur",
    "*To:* Bali",
    "*Departure:* 2026-12-01",
    "*Duration:* 5-7 nights",
    "*Trip type:* Honeymoon",
    "*Adults:* 2",
    "*Children:* 1 (ages: 6)",
    "*Hotel category:* 4 Star",
    "*Meal plan:* Breakfast",
    "*Budget:* ₹1–2 Lakh",
    "*Name:* Asha Verma",
    "*Phone:* +91 98765 43210",
    "*Email:* asha@example.com",
    "*Call-back slot:* Morning (9:00 AM – 12:00 PM)",
    "*Notes:* Pool villa & sunset dinner #1",
  ]);
});

test("composeQuoteWhatsAppMessage: omits empty fields and Children when 0", () => {
  const msg = L.composeQuoteWhatsAppMessage(
    { services: ["Visa"], fullName: "Ravi", phone: "9876543210", adults: 1, children: 0, childAges: "", email: "  ", notes: "" },
    BUSINESS,
  );
  assert.equal(msg.split("\n").slice(2).join("|"), "*Services:* Visa|*Adults:* 1|*Name:* Ravi|*Phone:* 9876543210");
  for (const label of ["Children", "Email", "Notes", "From", "Call-back slot"]) {
    assert.ok(!msg.includes(`*${label}:*`), label);
  }
  // Children without ages; empty services list omitted.
  const msg2 = L.composeQuoteWhatsAppMessage({ services: [], children: 2, fullName: "X Y" }, BUSINESS);
  assert.ok(msg2.includes("*Children:* 2\n"));
  assert.ok(!msg2.includes("*Services:*"));
});

const pkg = PACKAGES.find((p) => p.tiers.some((t) => t.childPriceINR != null));
const tier = pkg.tiers[0];

test("composeBookingWhatsAppMessage: Breakdown variant with standard rule", () => {
  const breakdown = L.computeBookingBreakdown({ tier, adults: 2, children: 1 }, "2026-12-01", "2026-06-01");
  assert.equal(breakdown.rule, "standard");
  const msg = L.composeBookingWhatsAppMessage(pkg, { tierId: tier.id, travelDate: "2026-12-01", currency: "INR" }, breakdown, BUSINESS, CURRENCIES);
  for (const part of [
    BUSINESS.brandName,
    pkg.title,
    tier.label,
    "*Adults:* 2",
    "*Children:* 1",
    "2026-12-01",
    L.formatPrice(breakdown.total, "INR"),
    L.formatPrice(breakdown.advance, "INR"),
    L.formatPrice(breakdown.balance, "INR"),
    breakdown.balanceDueDate,
  ]) {
    assert.ok(msg.includes(part), part);
  }
  assert.ok(!msg.includes("Advance as per Travel Guru payment policy"));
  assert.ok(!msg.includes("Indicative"));
  assert.equal(msg.split("\n").at(-1), "Flights & visa to be quoted separately.");
});

test("composeBookingWhatsAppMessage: within-window breakdown shows no balance", () => {
  const breakdown = L.computeBookingBreakdown({ tier, adults: 1, children: 0 }, "2026-06-10", "2026-06-01");
  assert.equal(breakdown.rule, "within-window");
  const msg = L.composeBookingWhatsAppMessage(pkg, { tierId: tier.id, travelDate: "2026-06-10" }, breakdown, BUSINESS, CURRENCIES);
  assert.ok(msg.includes(L.formatPrice(breakdown.advance, "INR")));
  assert.ok(!msg.includes("*Balance:*"));
  assert.ok(!msg.includes("*Children:*"));
});

test("composeBookingWhatsAppMessage: LandTotal variant and indicative conversion", () => {
  const land = L.computeLandTotal({ tier, adults: 3, children: 0 });
  const msg = L.composeBookingWhatsAppMessage(pkg, { tierId: tier.id, currency: "USD" }, land, BUSINESS, CURRENCIES);
  assert.ok(msg.includes("*Adults:* 3"));
  assert.ok(msg.includes(L.formatPrice(land.total, "INR")));
  assert.ok(msg.includes("Advance as per Travel Guru payment policy"));
  assert.ok(!msg.includes("*Advance on confirmation:*"));
  assert.ok(!msg.includes("*Travel date:*"));
  assert.ok(!msg.includes("*Balance:*"));
  assert.ok(msg.includes(L.formatPrice(L.convertPrice(land.total, "USD"), "USD")));
  assert.equal(msg.split("\n").at(-1), "Flights & visa to be quoted separately.");
});

test("buildWhatsAppUrl: format and exact round-trip", () => {
  const message = "Hi ₹3,90,000 & #1 😀\nline 2 ? = +";
  const url = L.buildWhatsAppUrl(BUSINESS.whatsapp, message);
  assert.ok(url.startsWith(`https://wa.me/${BUSINESS.whatsapp}?text=`));
  assert.equal(url, `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(message)}`);
  assert.equal(decodeURIComponent(url.split("?text=")[1]), message);
  assert.equal(new URL(url).searchParams.get("text"), message);
});
