// Shared helpers for the prototype-visual-parity CSS property tests.
// Support module only: the npm test glob is "tests/**/*.test.js", so this file
// is never run as a test on its own.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GLOBALS = join(ROOT, 'app', 'globals.css');
const COMPONENTS = join(ROOT, 'components');

// ---------------------------------------------------------------------------
// File discovery and CSS text helpers
// ---------------------------------------------------------------------------

function walk(dir, out) {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith('.module.css')) out.push(full);
  }
  return out;
}

/**
 * Absolute paths of every stylesheet in scope:
 * `app/globals.css` first, then `components/**\/*.module.css` (sorted).
 */
export function listCssFiles() {
  return [GLOBALS, ...walk(COMPONENTS, [])];
}

/** Repo-relative, forward-slash path for readable assertion messages. */
export function relPath(file) {
  return relative(ROOT, file).split('\\').join('/');
}

/** Read a stylesheet as UTF-8 text. */
export function readCss(file) {
  return readFileSync(file, 'utf8');
}

/** Remove block comments. Newlines are kept so line numbers stay stable. */
export function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

/**
 * Custom properties declared anywhere in a stylesheet (`--name: value`),
 * as a Map of name -> last declared value.
 */
export function declaredProps(css) {
  const out = new Map();
  const re = /(--[\w-]+)\s*:\s*([^;{}]+)/g;
  let m;
  while ((m = re.exec(stripComments(css)))) out.set(m[1], m[2].trim());
  return out;
}

/**
 * Custom properties declared in the `:root` block(s) of `app/globals.css`
 * (including the `:root` overrides inside media queries; later wins).
 * Returns a plain object of name -> value.
 */
export function readRootTokens() {
  const css = stripComments(readCss(GLOBALS));
  const tokens = {};
  const blockRe = /:root\s*\{([^{}]*)\}/g;
  let block;
  while ((block = blockRe.exec(css))) {
    for (const [name, value] of declaredProps(block[1])) tokens[name] = value;
  }
  return tokens;
}

/**
 * Every `var(--name ...)` reference in a stylesheet, comments ignored.
 * `hasFallback` is true when the reference has a comma fallback.
 */
export function varRefs(css) {
  const out = [];
  const re = /var\(\s*(--[\w-]+)\s*(,)?/g;
  const text = stripComments(css);
  let m;
  while ((m = re.exec(text))) {
    out.push({ name: m[1], hasFallback: m[2] === ',' });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Colour parsing
// ---------------------------------------------------------------------------

/** Parse #rgb, #rgba, #rrggbb or #rrggbbaa to `[r, g, b]` (0-255). */
export function parseHex(hex) {
  let h = String(hex).trim().replace(/^#/, '');
  if (!/^[0-9a-f]+$/i.test(h) || ![3, 4, 6, 8].includes(h.length)) {
    throw new Error(`Not a hex colour: ${hex}`);
  }
  if (h.length <= 4) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/**
 * Parse a hex, `rgb()` or `rgba()` colour to `{ rgb: [r, g, b], alpha }`.
 * Alpha is 1 when absent.
 */
export function parseColor(value) {
  const s = String(value).trim();
  if (s.startsWith('#')) {
    const h = s.slice(1);
    let alpha = 1;
    if (h.length === 4) alpha = parseInt(h[3] + h[3], 16) / 255;
    if (h.length === 8) alpha = parseInt(h.slice(6, 8), 16) / 255;
    return { rgb: parseHex(s), alpha };
  }
  const m = /^rgba?\(\s*([^)]+)\)$/i.exec(s);
  if (!m) throw new Error(`Unsupported colour: ${value}`);
  const parts = m[1].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) throw new Error(`Unsupported colour: ${value}`);
  const rgb = parts.slice(0, 3).map((p) =>
    p.endsWith('%') ? Math.round((parseFloat(p) / 100) * 255) : parseFloat(p),
  );
  let alpha = 1;
  if (parts[3] !== undefined) {
    alpha = parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
  }
  return { rgb, alpha };
}

// ---------------------------------------------------------------------------
// WCAG contrast and blending
// ---------------------------------------------------------------------------

export const channel = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export const luminance = ([r, g, b]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Browsers blend in gamma-encoded sRGB, so blend the 0-255 channels directly.
export const over = (fg, alpha, bg) => fg.map((v, i) => v * alpha + bg[i] * (1 - alpha));

export const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
