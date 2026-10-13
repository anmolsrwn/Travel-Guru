import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PACKAGES } from '../lib/data.js';
import { packageToRow } from '../lib/content-mapping.js';
import { dataJsonFor, fieldsFromFormData, readPackageForm, NEW_PACKAGE_DATA } from '../lib/package-form.js';

/** Editor fields for a Package, as the form would submit them. */
function fieldsFor(pkg, extra = {}) {
  return {
    originalId: '',
    id: pkg.id,
    title: pkg.title,
    region: pkg.region,
    categories: [...pkg.categories],
    nights: String(pkg.nights),
    days: String(pkg.days),
    image: pkg.image,
    sortOrder: '10',
    isPublished: true,
    data: dataJsonFor(pkg),
    ...extra,
  };
}

test('every PACKAGES entry passes through the editor unchanged (Req 44.5, 44.6)', () => {
  for (const p of PACKAGES) {
    const r = readPackageForm(fieldsFor(p));
    assert.equal(r.valid, true, `${p.id}: ${JSON.stringify(r.errors)}`);
    assert.equal(r.isCreate, true);
    assert.deepEqual(r.row, packageToRow(p, { sortOrder: 10, isPublished: true }));
  }
});

test('fieldsFromFormData reads every field, including repeated categories and the toggle', () => {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ id: 'a', title: 'T', region: 'domestic', nights: '2', days: '3', image: '/assets/x.jpg', sortOrder: '0', data: '{}' })) fd.set(k, v);
  fd.append('categories', 'domestic');
  fd.append('categories', 'family');
  fd.set('isPublished', 'on');
  const f = fieldsFromFormData(fd);
  assert.deepEqual(f.categories, ['domestic', 'family']);
  assert.equal(f.isPublished, true);
  assert.equal(f.originalId, '');
  assert.equal(fieldsFromFormData(new FormData()).isPublished, false);
});

test('a JSON syntax error or a non-object is reported under data and nothing else is built', () => {
  const p = PACKAGES[0];
  for (const data of ['{"tiers": [', '[]', 'null', '"x"']) {
    const r = readPackageForm(fieldsFor(p, { data }));
    assert.equal(r.valid, false);
    assert.equal(r.row, null);
    assert.ok(r.errors.data, data);
  }
});

test('validation errors are keyed by path; unknown data keys are rejected', () => {
  const p = PACKAGES[0];
  const data = JSON.parse(dataJsonFor(p));
  data.tiers[1].hotels[0].nights += 1;
  data.title = 'shadow column';
  const r = readPackageForm(fieldsFor(p, { days: String(p.days + 1), data: JSON.stringify(data) }));
  assert.equal(r.valid, false);
  assert.ok(r.errors.days);
  assert.ok(r.errors['tiers[1].hotels']);
  assert.equal(r.errors['data.title'], 'Unknown field');
});

test('edit uses the original id; "new" is reserved on create; sort order must be an integer', () => {
  const p = PACKAGES[0];
  const edit = readPackageForm(fieldsFor(p, { originalId: p.id, id: 'something-else' }));
  assert.equal(edit.valid, true);
  assert.equal(edit.isCreate, false);
  assert.equal(edit.row.id, p.id);

  assert.ok(readPackageForm(fieldsFor(p, { id: 'new' })).errors.id);
  assert.ok(readPackageForm(fieldsFor(p, { sortOrder: '1.5' })).errors.sortOrder);
  assert.ok(readPackageForm(fieldsFor(p, { sortOrder: '' })).errors.sortOrder);
});

test('the new-package template parses as a data object with only known keys', () => {
  const r = readPackageForm({
    originalId: '', id: 'draft', title: 'Draft', region: 'international', categories: ['international'],
    nights: '1', days: '2', image: '/assets/draft.jpg', sortOrder: '0', isPublished: false,
    data: JSON.stringify(NEW_PACKAGE_DATA),
  });
  assert.equal(Object.keys(r.errors).some((k) => k.startsWith('data')), false);
});
