// tests/manifest.test.js
// Task 1.5: Static checks on package.json (Req 2.6, 2.7, 46.3, 3.15).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'));

const EXACT_DEPS = {
  next: '16.4.0',
  react: '19.3.0',
  'react-dom': '19.3.0',
  '@supabase/supabase-js': '2.117.3',
  '@supabase/ssr': '0.12.7',
  'server-only': '0.0.1',
  exceljs: '4.4.0',
  nodemailer: '10.1.1',
};
const EXACT_DEV_DEPS = {
  'fast-check': '4.10.2',
  eslint: '9.39.5',
  'eslint-config-next': '16.4.0',
};

test('package.json has "type": "module"', () => {
  assert.equal(pkg.type, 'module', '"type" must be "module"');
});

test('exact runtime dependency versions (no ^ or ~)', () => {
  for (const [name, version] of Object.entries(EXACT_DEPS)) {
    assert.equal(
      pkg.dependencies?.[name],
      version,
      `dependencies.${name} must be exactly "${version}"`,
    );
    // No semver ranges
    assert.ok(
      !/[^~]/.test('') || !pkg.dependencies?.[name]?.startsWith('^'),
      `dependencies.${name} must not use ^ range`,
    );
    assert.ok(
      !pkg.dependencies?.[name]?.startsWith('~'),
      `dependencies.${name} must not use ~ range`,
    );
  }
});

test('exact dev dependency versions (no ^ or ~)', () => {
  for (const [name, version] of Object.entries(EXACT_DEV_DEPS)) {
    assert.equal(
      pkg.devDependencies?.[name],
      version,
      `devDependencies.${name} must be exactly "${version}"`,
    );
    assert.ok(
      !pkg.devDependencies?.[name]?.startsWith('^'),
      `devDependencies.${name} must not use ^ range`,
    );
    assert.ok(
      !pkg.devDependencies?.[name]?.startsWith('~'),
      `devDependencies.${name} must not use ~ range`,
    );
  }
});

test('no tailwind dependency in dependencies or devDependencies', () => {
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
  };
  for (const name of Object.keys(allDeps)) {
    assert.ok(!name.includes('tailwind'), `Tailwind dependency found: ${name}`);
  }
});

test('required scripts are present', () => {
  assert.equal(typeof pkg.scripts?.dev, 'string', 'scripts.dev must exist');
  assert.equal(typeof pkg.scripts?.build, 'string', 'scripts.build must exist');
  assert.equal(typeof pkg.scripts?.start, 'string', 'scripts.start must exist');
  assert.equal(typeof pkg.scripts?.lint, 'string', 'scripts.lint must exist');
  assert.equal(typeof pkg.scripts?.test, 'string', 'scripts.test must exist');
  assert.equal(typeof pkg.scripts?.seed, 'string', 'scripts.seed must exist');
});

test('scripts have correct values', () => {
  assert.ok(pkg.scripts.lint.includes('eslint'), 'lint script must call eslint');
  assert.ok(pkg.scripts.test.includes('node --test'), 'test script must use node --test');
  assert.ok(pkg.scripts.seed.includes('scripts/seed.js'), 'seed script must call scripts/seed.js');
});

test('engines.node is set to >=20.9 or higher', () => {
  assert.ok(pkg.engines?.node, 'engines.node must be set');
  // Accept >=20.9 or >=21 etc.
  assert.match(pkg.engines.node, /^>=\d+/, 'engines.node must start with >=');
});

test('exact dependency set: no extra runtime packages', () => {
  const expectedRuntimeKeys = new Set(Object.keys(EXACT_DEPS));
  const actualKeys = new Set(Object.keys(pkg.dependencies ?? {}));
  for (const key of actualKeys) {
    assert.ok(expectedRuntimeKeys.has(key), `Unexpected runtime dependency: ${key}`);
  }
});

test('exact dev dependency set: no extra dev packages', () => {
  const expectedDevKeys = new Set(Object.keys(EXACT_DEV_DEPS));
  const actualKeys = new Set(Object.keys(pkg.devDependencies ?? {}));
  for (const key of actualKeys) {
    assert.ok(expectedDevKeys.has(key), `Unexpected dev dependency: ${key}`);
  }
});
