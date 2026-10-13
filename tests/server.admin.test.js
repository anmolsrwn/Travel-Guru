// Example tests for lib/server/admin.js (checkAdmin, runAdminMutation).
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkAdmin, runAdminMutation } from "../lib/server/admin.js";
import { LEAD_STATUSES } from "../lib/data.js";

const ADMIN = { id: "admin-1" };
const OTHER = { id: "user-2" };
const isAdminUser = async (u) => u.id === ADMIN.id;

function spy(result = "done") {
  const fn = async (user) => {
    fn.calls.push(user);
    return result;
  };
  fn.calls = [];
  return fn;
}

const statusValidator = (status) => () =>
  LEAD_STATUSES.includes(status)
    ? { valid: true, errors: {} }
    : { valid: false, errors: { status: "Invalid status" } };

test("checkAdmin: admin → ok with user", async () => {
  assert.deepEqual(await checkAdmin({ getUser: async () => ADMIN, isAdminUser }), { ok: true, user: ADMIN });
});

test("checkAdmin: no user → unauthenticated, isAdminUser not called", async () => {
  let called = false;
  const r = await checkAdmin({ getUser: async () => null, isAdminUser: () => (called = true) });
  assert.deepEqual(r, { ok: false, reason: "unauthenticated" });
  assert.equal(called, false);
});

test("checkAdmin: non-admin → forbidden", async () => {
  assert.deepEqual(await checkAdmin({ getUser: async () => OTHER, isAdminUser }), { ok: false, reason: "forbidden" });
});

test("checkAdmin: truthy non-boolean admin result → forbidden", async () => {
  const r = await checkAdmin({ getUser: () => OTHER, isAdminUser: () => "yes" });
  assert.deepEqual(r, { ok: false, reason: "forbidden" });
});

test("checkAdmin: getUser throws → unauthenticated; isAdminUser throws → forbidden", async () => {
  const boom = () => { throw new Error("network"); };
  assert.deepEqual(await checkAdmin({ getUser: boom, isAdminUser }), { ok: false, reason: "unauthenticated" });
  assert.deepEqual(await checkAdmin({ getUser: () => ADMIN, isAdminUser: boom }), { ok: false, reason: "forbidden" });
});

test("runAdminMutation: admin + valid input → mutate called once with user", async () => {
  const mutate = spy("updated");
  const r = await runAdminMutation({ getUser: async () => ADMIN, isAdminUser, validate: statusValidator("contacted"), mutate });
  assert.deepEqual(r, { ok: true, value: "updated" });
  assert.deepEqual(mutate.calls, [ADMIN]);
});

test("runAdminMutation: default validate allows mutation", async () => {
  const mutate = spy();
  const r = await runAdminMutation({ getUser: () => ADMIN, isAdminUser, mutate });
  assert.equal(r.ok, true);
  assert.equal(mutate.calls.length, 1);
});

test("runAdminMutation: signed out → unauthenticated, mutate and validate never called", async () => {
  const mutate = spy();
  let validated = false;
  const r = await runAdminMutation({
    getUser: async () => null,
    isAdminUser,
    validate: () => { validated = true; return { valid: true, errors: {} }; },
    mutate,
  });
  assert.deepEqual(r, { ok: false, reason: "unauthenticated" });
  assert.equal(mutate.calls.length, 0);
  assert.equal(validated, false);
});

test("runAdminMutation: non-admin → forbidden, mutate never called", async () => {
  const mutate = spy();
  const r = await runAdminMutation({ getUser: async () => OTHER, isAdminUser, validate: statusValidator("new"), mutate });
  assert.deepEqual(r, { ok: false, reason: "forbidden" });
  assert.equal(mutate.calls.length, 0);
});

test("runAdminMutation: status outside LEAD_STATUSES → invalid with errors, mutate never called", async () => {
  const mutate = spy();
  const r = await runAdminMutation({ getUser: async () => ADMIN, isAdminUser, validate: statusValidator("deleted"), mutate });
  assert.deepEqual(r, { ok: false, reason: "invalid", errors: { status: "Invalid status" } });
  assert.equal(mutate.calls.length, 0);
});

test("runAdminMutation: validate throws → invalid, mutate never called", async () => {
  const mutate = spy();
  const r = await runAdminMutation({
    getUser: () => ADMIN,
    isAdminUser,
    validate: () => { throw new Error("bad"); },
    mutate,
  });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "invalid");
  assert.equal(mutate.calls.length, 0);
});

test("runAdminMutation: mutate throws → error result, no exception escapes", async () => {
  const err = new Error("violates foreign key constraint");
  const r = await runAdminMutation({
    getUser: () => ADMIN,
    isAdminUser,
    mutate: async () => { throw err; },
  });
  assert.deepEqual(r, { ok: false, reason: "error", error: err });
});
