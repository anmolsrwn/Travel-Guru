// Destination editor model (Requirement 44.8, 44.9): turns the admin form fields
// into a validated `destinations` row. Shared by DestinationForm (client feedback
// before sending) and the saveDestination Server Action (re-validate, never
// trusting the client). Pure: no I/O, no framework imports.
import { destinationToRow } from "./content-mapping.js";
import { validateDestination } from "./logic.js";

/** Path segment reserved for the "create" editor URL (/admin/destinations/new). */
export const NEW_DESTINATION_ID = "new";

const SORT_RANGE = [-1_000_000, 1_000_000];

const str = (v) => (typeof v === "string" ? v : "");

/** Integer-looking string → number; anything else is passed through for the check to reject. */
function toInt(raw) {
  const s = str(raw).trim();
  return /^-?\d{1,9}$/.test(s) ? Number(s) : s;
}

/**
 * Reads the editor fields from a FormData (browser or server).
 * @param {FormData} formData
 */
export function destinationFieldsFromFormData(formData) {
  return {
    originalId: str(formData.get("originalId")),
    id: str(formData.get("id")),
    name: str(formData.get("name")),
    tagline: str(formData.get("tagline")),
    region: str(formData.get("region")),
    image: str(formData.get("image")),
    packageId: str(formData.get("packageId")),
    sortOrder: str(formData.get("sortOrder")),
    isPublished: formData.get("isPublished") === "on",
  };
}

/**
 * Validates the editor fields. On edit (`originalId` set) the id is the original one.
 * An empty package select means "None" (null).
 * @param {ReturnType<typeof destinationFieldsFromFormData>} fields
 * @param {string[]} packageIds ids of existing packages
 * @returns {{ valid: boolean, errors: Record<string, string>, row: object | null, isCreate: boolean }}
 */
export function readDestinationForm(fields, packageIds) {
  const errors = {};
  const isCreate = fields.originalId === "";
  const id = isCreate ? fields.id.trim() : fields.originalId;
  if (isCreate && id === NEW_DESTINATION_ID) errors.id = `"${NEW_DESTINATION_ID}" is reserved`;

  const sortOrder = toInt(fields.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < SORT_RANGE[0] || sortOrder > SORT_RANGE[1]) {
    errors.sortOrder = "Must be an integer from -1,000,000 to 1,000,000";
  }

  const dest = {
    id,
    name: fields.name.trim(),
    tagline: fields.tagline.trim(),
    region: fields.region,
    image: fields.image.trim(),
    packageId: fields.packageId === "" ? null : fields.packageId,
  };
  const v = validateDestination(dest, { packageIds });
  for (const [path, message] of Object.entries(v.errors)) {
    if (!Object.hasOwn(errors, path)) errors[path] = message;
  }

  const valid = Object.keys(errors).length === 0;
  return {
    valid,
    errors,
    row: valid ? destinationToRow(dest, { sortOrder, isPublished: fields.isPublished }) : null,
    isCreate,
  };
}
