// What a CSV import changes in one category (pure, so it can be shown before anything is written).
// Rows are matched on their id (from an export), otherwise on refnr + kleur + maat + gender.
// Products that are not in the file are deleted, as the import has always replaced a category.
import { variantKey } from "./product.js";

// Fields an import can change; only the columns that are in the file are compared
export const IMPORT_FIELDS = ["refnr", "modelnaam", "merk", "kleur", "gender", "maat", "stock", "akp", "leverdatum", "lang_in_stock"];

const DEFAULTS = { modelnaam: "", merk: "", kleur: "", gender: "", maat: "", stock: 0, akp: null, leverdatum: "", lang_in_stock: false };

const version = (doc) => (doc.updated_at ? new Date(doc.updated_at).toISOString() : "");

// Older products miss fields: missing, null, "" and false all mean "not set"
const isEmpty = (value) => value === undefined || value === null || value === "" || value === false;
const same = (a, b) => (isEmpty(a) && isEmpty(b)) || a === b || (typeof a === "string" && String(b) === a);

// rows: [{ line, id, versie, fields }] with fields already validated (partial: only the columns in the file)
export function planCollection(rows, existing) {
  const byId = new Map(existing.map((doc) => [String(doc._id), doc]));
  const matched = new Set();
  const plan = { inserts: [], updates: [], deletes: [], conflicts: [], unchanged: 0 };

  for (const row of rows) {
    let doc = row.id ? byId.get(row.id) : null;
    if (!doc || matched.has(String(doc._id))) {
      const key = variantKey({ ...DEFAULTS, ...row.fields });
      doc = existing.find((d) => !matched.has(String(d._id)) && variantKey(d) === key) || null;
    }

    if (!doc) {
      plan.inserts.push({ line: row.line, doc: { ...DEFAULTS, ...row.fields } });
      continue;
    }
    matched.add(String(doc._id));

    // Changed in the app after the export: keep the newer data
    if (row.versie && row.versie !== version(doc)) {
      plan.conflicts.push({ line: row.line, doc });
      continue;
    }

    const set = {};
    for (const [key, value] of Object.entries(row.fields)) {
      if (IMPORT_FIELDS.includes(key) && !same(doc[key], value)) set[key] = value;
    }
    if (Object.keys(set).length) plan.updates.push({ line: row.line, doc, set });
    else plan.unchanged++;
  }

  plan.deletes = existing.filter((doc) => !matched.has(String(doc._id)));
  return plan;
}
