import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PACKAGES, DESTINATIONS } from '../lib/data.js';
import {
  packageToRow,
  rowToPackage,
  destinationToRow,
  rowToDestination,
} from '../lib/content-mapping.js';

const COLUMN_KEYS = ['id', 'title', 'region', 'categories', 'nights', 'days', 'image', 'data', 'is_published', 'sort_order'];

test('every PACKAGES entry round-trips through packageToRow/rowToPackage (Req 40.8)', () => {
  for (const p of PACKAGES) {
    const before = structuredClone(p);
    const row = packageToRow(p);
    assert.deepEqual(Object.keys(row).sort(), [...COLUMN_KEYS].sort(), p.id);
    assert.equal(row.is_published, true);
    assert.equal(row.sort_order, 0);
    for (const k of ['id', 'title', 'region', 'nights', 'days', 'image']) assert.ok(!(k in row.data), `${p.id}: ${k} in data`);
    assert.deepEqual(rowToPackage(row), p, p.id);
    assert.deepEqual(p, before, `${p.id} mutated`);
  }
});

test('every DESTINATIONS entry round-trips through destinationToRow/rowToDestination (Req 40.8)', () => {
  for (const d of DESTINATIONS) {
    const before = structuredClone(d);
    const row = destinationToRow(d, { sortOrder: 30, isPublished: false });
    assert.equal(row.package_id, d.packageId);
    assert.equal(row.sort_order, 30);
    assert.equal(row.is_published, false);
    assert.deepEqual(rowToDestination(row), d, d.id);
    assert.deepEqual(d, before, `${d.id} mutated`);
  }
});

test('packageToRow honours options and does not share nested objects with the input', () => {
  const p = PACKAGES[0];
  const row = packageToRow(p, { sortOrder: 20, isPublished: false });
  assert.equal(row.sort_order, 20);
  assert.equal(row.is_published, false);
  assert.notEqual(row.categories, p.categories);
  assert.notEqual(row.data.tiers, p.tiers);
});

test('rowToPackage: columns win over data keys, unknown data keys dropped', () => {
  const row = packageToRow(PACKAGES[0]);
  const tampered = {
    ...row,
    data: { ...row.data, id: 'evil', title: 'Evil', nights: 99, image: 'x', secret: 'internal', is_published: false },
  };
  const before = structuredClone(tampered);
  const pkg = rowToPackage(tampered);
  assert.equal(pkg.id, row.id);
  assert.equal(pkg.title, row.title);
  assert.equal(pkg.nights, row.nights);
  assert.equal(pkg.image, row.image);
  assert.ok(!('secret' in pkg));
  assert.ok(!('is_published' in pkg) && !('sort_order' in pkg) && !('data' in pkg));
  assert.deepEqual(tampered, before);
});

test('rowToPackage tolerates missing data; rowToDestination maps missing package_id to null', () => {
  const pkg = rowToPackage({ id: 'a', title: 'T', region: 'domestic', categories: ['domestic'], nights: 1, days: 2, image: '/assets/a.jpg', data: null });
  assert.deepEqual(pkg, { id: 'a', title: 'T', region: 'domestic', categories: ['domestic'], nights: 1, days: 2, image: '/assets/a.jpg' });
  const d = rowToDestination({ id: 'x', name: 'X', tagline: 'Y', region: 'domestic', image: '/assets/x.jpg' });
  assert.equal(d.packageId, null);
});
