// Row mapping between the Data Models shapes (Package, Destination) and the
// Supabase `packages` / `destinations` rows (design 6.4 / 6.5).
// Pure: no I/O, no globals, no framework imports. Inputs are never mutated and
// outputs never share nested objects with their inputs.

/** Package keys stored inside the `data jsonb` column; everything else is a real column. */
export const PACKAGE_DATA_KEYS = Object.freeze([
  "destination",
  "highlights",
  "hotelStarRating",
  "mealPlan",
  "transferBasis",
  "tiers",
  "extras",
  "inclusions",
  "itinerary",
  "isSample",
  "notes",
  "seasons",
]);
const DATA_KEYS = PACKAGE_DATA_KEYS;

/** Deep copy of a JSON-like value (arrays, plain objects, primitives). */
function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (value !== null && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = clone(value[k]);
    return out;
  }
  return value;
}

/** Copies the listed keys of `obj` that are present and not undefined. */
function pick(obj, keys) {
  const out = {};
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return out;
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined) out[k] = clone(obj[k]);
  }
  return out;
}

/**
 * Package → `packages` row.
 * @param {object} pkg Package (Data Models shape)
 * @param {{ sortOrder?: number, isPublished?: boolean }} [opts]
 */
export function packageToRow(pkg, { sortOrder = 0, isPublished = true } = {}) {
  return {
    id: pkg.id,
    title: pkg.title,
    region: pkg.region,
    categories: clone(pkg.categories),
    nights: pkg.nights,
    days: pkg.days,
    image: pkg.image,
    data: pick(pkg, DATA_KEYS),
    is_published: isPublished,
    sort_order: sortOrder,
  };
}

/**
 * `packages` row → Package. Columns win over same-named keys inside `data`;
 * unknown keys inside `data` are dropped.
 * @param {object} row
 */
export function rowToPackage(row) {
  const { id, title, region, categories, nights, days, image } = row;
  return {
    ...pick(row.data ?? {}, DATA_KEYS),
    id,
    title,
    region,
    categories: clone(categories),
    nights,
    days,
    image,
  };
}

/**
 * Destination → `destinations` row.
 * @param {object} d Destination (Data Models shape)
 * @param {{ sortOrder?: number, isPublished?: boolean }} [opts]
 */
export function destinationToRow(d, { sortOrder = 0, isPublished = true } = {}) {
  return {
    id: d.id,
    name: d.name,
    tagline: d.tagline,
    region: d.region,
    image: d.image,
    package_id: d.packageId ?? null,
    sort_order: sortOrder,
    is_published: isPublished,
  };
}

/**
 * `destinations` row → Destination.
 * @param {object} r
 */
export function rowToDestination(r) {
  return {
    id: r.id,
    name: r.name,
    tagline: r.tagline,
    region: r.region,
    image: r.image,
    packageId: r.package_id ?? null,
  };
}
