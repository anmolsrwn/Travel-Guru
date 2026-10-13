import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../lib/server/rate-limit.js';

test('allows up to limit calls in the window, then denies with retryAfterMs', () => {
  const rl = createRateLimiter({ limit: 3, windowMs: 1000 });
  assert.deepEqual(rl.check('a', 0), { allowed: true, remaining: 2, retryAfterMs: 0 });
  assert.deepEqual(rl.check('a', 100), { allowed: true, remaining: 1, retryAfterMs: 0 });
  assert.deepEqual(rl.check('a', 200), { allowed: true, remaining: 0, retryAfterMs: 0 });
  assert.deepEqual(rl.check('a', 400), { allowed: false, remaining: 0, retryAfterMs: 600 });
});

test('window slides: oldest hit expires exactly at windowMs', () => {
  const rl = createRateLimiter({ limit: 2, windowMs: 1000 });
  rl.check('a', 0);
  rl.check('a', 500);
  assert.equal(rl.check('a', 999).allowed, false);
  assert.equal(rl.check('a', 999).retryAfterMs, 1);
  assert.deepEqual(rl.check('a', 1000), { allowed: true, remaining: 0, retryAfterMs: 0 });
  assert.equal(rl.check('a', 1200).retryAfterMs, 300);
});

test('denied calls do not consume allowance', () => {
  const rl = createRateLimiter({ limit: 1, windowMs: 1000 });
  rl.check('a', 0);
  for (let t = 1; t < 1000; t += 100) assert.equal(rl.check('a', t).allowed, false);
  assert.equal(rl.check('a', 1000).allowed, true);
});

test('keys are independent', () => {
  const rl = createRateLimiter({ limit: 1, windowMs: 1000 });
  assert.equal(rl.check('quote:1.1.1.1', 0).allowed, true);
  assert.equal(rl.check('quote:1.1.1.1', 1).allowed, false);
  assert.equal(rl.check('quote:2.2.2.2', 1).allowed, true);
  assert.equal(rl.check('booking:1.1.1.1', 1).allowed, true);
});

test('evicts the least recently used key beyond maxKeys', () => {
  const rl = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2 });
  rl.check('a', 0);
  rl.check('b', 0);
  rl.check('a', 1); // denied; does not refresh recency
  rl.check('c', 2); // evicts 'a' (least recently used)
  assert.equal(rl.check('a', 3).allowed, true); // 'a' forgotten
  assert.equal(rl.check('c', 4).allowed, false); // 'c' still tracked
});
