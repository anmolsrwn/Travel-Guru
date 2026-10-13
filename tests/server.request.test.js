import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJsonBody, clientIp, isSameOrigin } from '../lib/server/request.js';

const MAX = 16384;

async function parseRequest(req) {
  const text = await req.text();
  return parseJsonBody(text, {
    maxBytes: MAX,
    contentType: req.headers.get('content-type'),
    contentLength: req.headers.get('content-length'),
  });
}

function post(body, headers = {}) {
  return new Request('https://example.com/api/quote', { method: 'POST', body, headers });
}

test('parseJsonBody accepts a JSON object from a Request', async () => {
  const r = await parseRequest(post('{"a":1}', { 'content-type': 'application/json; charset=utf-8' }));
  assert.deepEqual(r, { ok: true, value: { a: 1 } });
});

test('parseJsonBody returns 415 for non-JSON content types', async () => {
  const r = await parseRequest(post('{"a":1}', { 'content-type': 'text/plain' }));
  assert.deepEqual(r, { ok: false, status: 415, error: 'unsupported_media_type' });
  assert.equal(parseJsonBody('{}', { maxBytes: MAX }).status, 415);
});

test('parseJsonBody returns 413 by UTF-8 bytes and by declared Content-Length', async () => {
  // 'é' is 2 bytes: 3 chars fit a 4-char limit but not a 4-byte limit
  const r1 = parseJsonBody('"éé"', { maxBytes: 4, contentType: 'application/json' });
  assert.equal(r1.status, 413);
  const big = JSON.stringify({ x: 'a'.repeat(MAX) });
  const r2 = await parseRequest(post(big, { 'content-type': 'application/json' }));
  assert.deepEqual(r2, { ok: false, status: 413, error: 'too_large' });
  const r3 = parseJsonBody('{}', { maxBytes: MAX, contentType: 'application/json', contentLength: '99999' });
  assert.equal(r3.status, 413);
  const exact = parseJsonBody('{}', { maxBytes: 2, contentType: 'application/json' });
  assert.equal(exact.ok, true);
});

test('parseJsonBody returns 400 bad_json for invalid or non-object JSON', () => {
  for (const body of ['', '{bad', '[]', 'null', '42', '"s"', 'true']) {
    assert.deepEqual(
      parseJsonBody(body, { maxBytes: MAX, contentType: 'application/json' }),
      { ok: false, status: 400, error: 'bad_json' },
      body
    );
  }
});

test('clientIp prefers first x-forwarded-for, then x-real-ip, else unknown', () => {
  assert.equal(clientIp(new Headers({ 'x-forwarded-for': ' 1.2.3.4 , 5.6.7.8', 'x-real-ip': '9.9.9.9' })), '1.2.3.4');
  assert.equal(clientIp(new Headers({ 'x-real-ip': '9.9.9.9' })), '9.9.9.9');
  assert.equal(clientIp(new Headers()), 'unknown');
  assert.equal(clientIp(post('{}', { 'x-forwarded-for': '10.0.0.1' }).headers), '10.0.0.1');
  assert.equal(clientIp({ 'x-forwarded-for': '2.2.2.2' }), '2.2.2.2');
});

test('isSameOrigin: absent origin true, matching host true, mismatch or malformed false', () => {
  const req = new Request('https://example.com/api', { headers: { origin: 'https://example.com', host: 'example.com' } });
  assert.equal(isSameOrigin(req.headers.get('origin'), 'example.com'), true);
  assert.equal(isSameOrigin(null, 'example.com'), true);
  assert.equal(isSameOrigin(undefined, 'example.com'), true);
  assert.equal(isSameOrigin('http://localhost:3000', 'localhost:3000'), true);
  assert.equal(isSameOrigin('https://evil.com', 'example.com'), false);
  assert.equal(isSameOrigin('http://localhost:3001', 'localhost:3000'), false);
  assert.equal(isSameOrigin('not a url', 'example.com'), false);
  assert.equal(isSameOrigin('null', 'example.com'), false);
});
