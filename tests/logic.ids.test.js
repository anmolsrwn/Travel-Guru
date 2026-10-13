// Example tests for ticket IDs, booking references and the call-back deadline.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BUSINESS, CALLBACK_SLOTS } from "../lib/data.js";
import * as L from "../lib/logic.js";

const BOOKING_REF = /^BK-[A-HJ-NP-Z2-9]{6}$/;

test("generateTicketId: padding, modulo and negative n", () => {
  assert.equal(L.generateTicketId(2026, 4821), "QT-2026-4821");
  assert.equal(L.generateTicketId(2026, 7), "QT-2026-0007");
  assert.equal(L.generateTicketId(2026, 0), "QT-2026-0000");
  assert.equal(L.generateTicketId(2026, 12345), "QT-2026-2345");
  assert.equal(L.generateTicketId(2026, -1), "QT-2026-9999");
  assert.equal(L.generateTicketId(9999, 9999), "QT-9999-9999");
  assert.ok(L.isValidTicketId(L.generateTicketId(2000, -10001)));
});

test("isValidTicketId: strict format, non-strings false without throwing", () => {
  assert.equal(L.isValidTicketId("QT-2026-4821"), true);
  for (const bad of ["QT-2026-482", "QT-26-4821", "qt-2026-4821", " QT-2026-4821", "QT-2026-4821\n", "BK-ABCDEF", ""]) {
    assert.equal(L.isValidTicketId(bad), false, bad);
  }
  for (const bad of [null, undefined, 20264821, {}, ["QT-2026-4821"]]) {
    assert.equal(L.isValidTicketId(bad), false);
  }
});

test("generateBookingRef: format, determinism, bounds", () => {
  for (const n of [0, 1, 31, 32, 2 ** 30 - 1, 2 ** 30, 2 ** 31, 0xffffffff, 123456789]) {
    const ref = L.generateBookingRef(n);
    assert.match(ref, BOOKING_REF, String(n));
    assert.equal(L.generateBookingRef(n), ref);
  }
  assert.equal(L.generateBookingRef(0), "BK-AAAAAA");
  assert.equal(L.generateBookingRef(31), "BK-AAAAA9");
  assert.notEqual(L.generateBookingRef(1), L.generateBookingRef(2));
  for (const bad of [-1, 2 ** 32, 1.5, NaN, "5", null]) {
    assert.throws(() => L.generateBookingRef(bad), RangeError);
  }
});

test("computeCallbackDeadline: offset, default hours, slot-independent, input untouched", () => {
  const now = new Date("2026-03-01T10:15:00.000Z");
  const before = now.getTime();
  const d = L.computeCallbackDeadline(now, CALLBACK_SLOTS[0].id);
  assert.notEqual(d, now);
  assert.equal(d.getTime() - before, BUSINESS.callbackHours * 3_600_000);
  assert.equal(d.toISOString(), "2026-03-02T10:15:00.000Z");
  assert.equal(now.getTime(), before);
  const ids = CALLBACK_SLOTS.map((s) => s.id);
  for (const id of ids) {
    assert.equal(L.computeCallbackDeadline(now, id, 48).getTime(), before + 48 * 3_600_000);
  }
});
