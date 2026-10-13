// Package editor model (Requirement 44.2, 44.5): turns the admin form fields
// into a validated `packages` row. Shared by PackageForm (client feedback before
// sending) and the savePackage Server Action (re-parse + re-validate, never
// trusting the client). Pure: no I/O, no framework imports.
import { PACKAGE_DATA_KEYS, packageToRow, rowToPackage } from "./content-mapping.js";
import { validatePackage } from "./logic.js";

/** Upper bound for the JSON textarea (characters). */
export const MAX_DATA_CHARS = 100_000;

/** Path segment reserved for the "create" editor URL (/admin/packages/new). */
export const NEW_PACKAGE_ID = "new";

const SORT_RANGE = [-1_000_000, 1_000_000];

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const str = (v) => (typeof v === "string" ? v : "");

/** Integer-looking string → number; anything else is passed through for the validator to reject. */
function toInt(raw) {
  const s = str(raw).trim();
  return /^-?\d{1,9}$/.test(s) ? Number(s) : s;
}

/**
 * Reads the editor fields from a FormData (browser or server).
 * @param {FormData} formData
 */
export function fieldsFromFormData(formData) {
  return {
    originalId: str(formData.get("originalId")),
    id: str(formData.get("id")),
    title: str(formData.get("title")),
    region: str(formData.get("region")),
    categories: formData.getAll("categories").filter((c) => typeof c === "string"),
    nights: str(formData.get("nights")),
    days: str(formData.get("days")),
    image: str(formData.get("image")),
    sortOrder: str(formData.get("sortOrder")),
    isPublished: formData.get("isPublished") === "on",
    data: str(formData.get("data")),
  };
}

/**
 * Parses and validates the editor fields.
 * On edit (`originalId` set) the id is the original one; the id field is ignored.
 * @param {ReturnType<typeof fieldsFromFormData>} fields
 * @returns {{ valid: boolean, errors: Record<string, string>, row: object | null, isCreate: boolean }}
 */
export function readPackageForm(fields) {
  const errors = {};
  const isCreate = fields.originalId === "";
  const id = isCreate ? fields.id.trim() : fields.originalId;
  if (isCreate && id === NEW_PACKAGE_ID) errors.id = `"${NEW_PACKAGE_ID}" is reserved`;

  const sortOrder = toInt(fields.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < SORT_RANGE[0] || sortOrder > SORT_RANGE[1]) {
    errors.sortOrder = "Must be an integer from -1,000,000 to 1,000,000";
  }

  let data = null;
  if (fields.data.length > MAX_DATA_CHARS) {
    errors.data = `Max ${MAX_DATA_CHARS.toLocaleString("en-US")} characters`;
  } else {
    try {
      data = JSON.parse(fields.data);
    } catch (e) {
      errors.data = `Invalid JSON: ${e instanceof Error ? e.message : "syntax error"}`;
    }
    if (!errors.data && !isPlainObject(data)) errors.data = "Must be a JSON object";
  }
  // Without a usable data object the package checks would only add noise.
  if (errors.data) return { valid: false, errors, row: null, isCreate };

  for (const k of Object.keys(data)) {
    if (!PACKAGE_DATA_KEYS.includes(k)) errors[`data.${k}`] = "Unknown field";
  }

  const pkg = rowToPackage({
    id,
    title: fields.title.trim(),
    region: fields.region,
    categories: fields.categories,
    nights: toInt(fields.nights),
    days: toInt(fields.days),
    image: fields.image.trim(),
    data,
  });
  const v = validatePackage(pkg);
  for (const [path, message] of Object.entries(v.errors)) {
    if (!Object.hasOwn(errors, path)) errors[path] = message;
  }

  const valid = Object.keys(errors).length === 0;
  return {
    valid,
    errors,
    row: valid ? packageToRow(pkg, { sortOrder, isPublished: fields.isPublished }) : null,
    isCreate,
  };
}

/** Pretty JSON for the textarea: only the keys packageToRow stores in `data`. */
export function dataJsonFor(pkg) {
  return JSON.stringify(packageToRow(pkg).data, null, 2);
}

/** Starting `data` for a new package (valid shape, content still to be filled in). */
export const NEW_PACKAGE_DATA = Object.freeze({
  destination: "",
  highlights: [],
  hotelStarRating: null,
  mealPlan: "",
  transferBasis: "",
  tiers: [
    { id: "deluxe", label: "Deluxe", adultPriceINR: 1, childPriceINR: null, hotels: [{ location: "", nights: 1, names: [""], roomType: null }] },
    { id: "superior", label: "Superior", adultPriceINR: 1, childPriceINR: null, hotels: [{ location: "", nights: 1, names: [""], roomType: null }] },
  ],
  extras: { flightFareINR: null, flightNote: null, visa: null, onArrivalCharges: [] },
  itinerary: [{ day: 1, title: "", description: "" }],
  notes: [],
});
