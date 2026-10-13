// lib/server/admin.js
// Pure admin authorization gate. All I/O (auth.getUser, admins lookup, the
// database write) is injected, so this module imports nothing from Next.js,
// React or Supabase and is fully testable.

/**
 * Verifies that the current user is signed in and is an Admin.
 * Fails closed: if `getUser` throws the result is "unauthenticated"; if
 * `isAdminUser` throws (or returns anything other than `true`) the result is
 * "forbidden".
 * @param {{ getUser: () => any, isAdminUser: (user: any) => any }} deps
 *   getUser → user | null (sync or async); isAdminUser → boolean (sync or async)
 * @returns {Promise<{ ok: true, user: any } | { ok: false, reason: "unauthenticated" | "forbidden" }>}
 */
export async function checkAdmin({ getUser, isAdminUser }) {
  let user;
  try {
    user = await getUser();
  } catch {
    return { ok: false, reason: "unauthenticated" };
  }
  if (user === null || user === undefined) return { ok: false, reason: "unauthenticated" };

  let isAdmin;
  try {
    isAdmin = await isAdminUser(user);
  } catch {
    return { ok: false, reason: "forbidden" };
  }
  if (isAdmin !== true) return { ok: false, reason: "forbidden" };
  return { ok: true, user };
}

const ALWAYS_VALID = () => ({ valid: true, errors: {} });

/**
 * Runs `mutate` only for a signed-in Admin with valid input (design 7.25).
 * Order: auth check → validate → mutate. `mutate` is called at most once.
 * If `validate` or `mutate` throws, no exception escapes: the result is
 * `{ ok: false, reason: "invalid" }` or `{ ok: false, reason: "error", error }`
 * so the calling Server Action can map the error (e.g. FK restrict) to a message.
 * @param {{
 *   getUser: () => any,
 *   isAdminUser: (user: any) => any,
 *   validate?: () => { valid: boolean, errors?: object },
 *   mutate: (user: any) => any
 * }} deps
 * @returns {Promise<{ ok: true, value: any } | { ok: false, reason: string, errors?: object, error?: unknown }>}
 */
export async function runAdminMutation({ getUser, isAdminUser, validate = ALWAYS_VALID, mutate }) {
  const auth = await checkAdmin({ getUser, isAdminUser });
  if (!auth.ok) return { ok: false, reason: auth.reason };

  let v;
  try {
    v = validate();
  } catch {
    return { ok: false, reason: "invalid", errors: {} };
  }
  if (!v || v.valid !== true) {
    return { ok: false, reason: "invalid", errors: (v && v.errors) || {} };
  }

  try {
    return { ok: true, value: await mutate(auth.user) };
  } catch (error) {
    return { ok: false, reason: "error", error };
  }
}
