import formidable from "formidable";
import fs from "fs/promises";
import { ObjectId } from "mongodb";
import { getClient } from "../../lib/mongodb";
import { historyEntry, recordHistory } from "../../lib/history";
import { existingDatabase, listCollectionNames } from "../../lib/inventory";
import { parseCsv } from "../../lib/csv";
import { IMPORT_FIELDS, planCollection } from "../../lib/import-plan";
import { cleanProductInput } from "../../lib/product-input";
import {
  SETTINGS_DB,
  allowMethods,
  assertCollectionName,
  normalizeNewCollectionName,
  safeEqual,
  sendError,
  HttpError,
} from "../../lib/api";

export const config = { api: { bodyParser: false } };

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BACKUPS = "import_backups";
const IMPORTS_TO_KEEP = 10;
const MAX_ERRORS_SHOWN = 20;

async function readUpload(req) {
  const form = formidable({ maxFileSize: MAX_FILE_SIZE, maxFiles: 1 });
  let files;
  try {
    [, files] = await form.parse(req);
  } catch {
    throw new HttpError(400, "Bestand kon niet gelezen worden (max 10 MB)");
  }
  const file = Array.isArray(files.file) ? files.file[0] : files.file;
  if (!file) throw new HttpError(400, "Geen bestand ontvangen");
  try {
    return await fs.readFile(file.filepath, "utf-8");
  } finally {
    fs.unlink(file.filepath).catch(() => {});
  }
}

// The category of a row: an existing name as is, anything else as a new safe name
function categoryOf(value, existing) {
  const raw = String(value || "").trim();
  if (existing.includes(raw)) return raw;
  const lower = raw.toLowerCase();
  if (existing.includes(lower)) return lower;
  return normalizeNewCollectionName(raw);
}

// Groups the CSV rows per category and validates them
function readRows(records, { dbName, fallbackCollection, existingCollections }) {
  const groups = new Map();
  const errors = [];
  let skipped = 0;

  records.forEach((record, index) => {
    const line = index + 2; // line 1 is the header
    try {
      if (record.database && record.database !== dbName) {
        skipped++;
        return;
      }
      const category = record.collectie || record.categorie || fallbackCollection;
      if (!category) throw new HttpError(400, "geen collectie");
      const name = categoryOf(category, existingCollections);

      // Only the columns that are in the file, so a file without "akp" keeps the prices
      const input = Object.fromEntries(IMPORT_FIELDS.filter((key) => key in record).map((key) => [key, record[key]]));
      if (!("refnr" in input)) throw new HttpError(400, "kolom refnr ontbreekt");
      const fields = cleanProductInput(input, { partial: true });

      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push({ line, id: String(record.id || "").trim(), versie: String(record.versie || "").trim(), fields });
    } catch (error) {
      errors.push({ line, message: error instanceof HttpError ? error.message : "ongeldige rij" });
    }
  });
  return { groups, errors, skipped };
}

async function backup(client, dbName, plans) {
  const backups = client.db(SETTINGS_DB).collection(BACKUPS);
  const importId = new Date();
  for (const { name, existing } of plans) {
    await backups.insertOne({ import_at: importId, db: dbName, collection: name, docs: existing });
  }
  // Keep the backups of the last imports only
  const dates = await backups.distinct("import_at");
  const old = dates.sort((a, b) => b - a).slice(IMPORTS_TO_KEEP);
  if (old.length) await backups.deleteMany({ import_at: { $in: old } });
}

async function apply(client, dbName, { name, plan }) {
  const collection = client.db(dbName).collection(name);
  const now = new Date();
  const history = [];
  const ops = [];

  for (const { doc } of plan.inserts) {
    const _id = new ObjectId();
    ops.push({ insertOne: { document: { _id, ...doc, updated_at: now } } });
    history.push(historyEntry({ db: dbName, collection: name, product: { ...doc, _id }, before: 0, after: doc.stock, source: "import" }));
  }
  for (const { doc, set } of plan.updates) {
    ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: { ...set, updated_at: now } } } });
    if ("stock" in set) {
      history.push(historyEntry({ db: dbName, collection: name, product: { ...doc, ...set }, before: doc.stock, after: set.stock, source: "import" }));
    }
  }
  for (const doc of plan.deletes) {
    ops.push({ deleteOne: { filter: { _id: doc._id } } });
    history.push(historyEntry({ db: dbName, collection: name, product: doc, before: doc.stock, after: 0, source: "import" }));
  }

  if (ops.length) await collection.bulkWrite(ops, { ordered: false });
  await recordHistory(history);
}

// POST ?db=&collection=&dryRun=1 with a CSV file. dryRun only returns what would change.
export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;

  try {
    // Optional extra password, on top of the login
    const password = process.env.IMPORT_PASSWORD;
    if (password && !safeEqual(req.headers["x-import-password"], password)) {
      throw new HttpError(401, "Verkeerd importwachtwoord");
    }

    const dbName = await existingDatabase(req.query.db);
    const fallbackCollection = req.query.collection ? assertCollectionName(req.query.collection) : null;
    const dryRun = req.query.dryRun === "1";

    const records = parseCsv(await readUpload(req));
    if (!records.length) throw new HttpError(400, "Het bestand is leeg of heeft geen kopregel");

    const existingCollections = await listCollectionNames(dbName);
    const { groups, errors, skipped } = readRows(records, { dbName, fallbackCollection, existingCollections });
    if (!groups.size) {
      throw new HttpError(400, errors[0] ? `Geen geldige rijen (regel ${errors[0].line}: ${errors[0].message})` : "Geen geldige rijen");
    }
    // A file with errors is never imported: a half import would delete the products of the bad rows
    if (errors.length && !dryRun) throw new HttpError(400, "Het bestand bevat fouten, controleer het eerst");

    const client = await getClient();
    const plans = [];
    for (const [name, rows] of groups) {
      const existing = existingCollections.includes(name) ? await client.db(dbName).collection(name).find({}).toArray() : [];
      plans.push({ name, isNew: !existingCollections.includes(name), existing, plan: planCollection(rows, existing) });
    }

    const summary = {
      collections: plans.map(({ name, isNew, plan }) => ({
        name,
        isNew,
        inserts: plan.inserts.length,
        updates: plan.updates.length,
        deletes: plan.deletes.length,
        conflicts: plan.conflicts.length,
        unchanged: plan.unchanged,
      })),
      errors: errors.slice(0, MAX_ERRORS_SHOWN),
      errorCount: errors.length,
      skipped,
    };
    for (const key of ["inserts", "updates", "deletes", "conflicts"]) {
      summary[`${key}Count`] = summary.collections.reduce((n, c) => n + c[key], 0);
    }

    if (dryRun) return res.status(200).json({ dryRun: true, ...summary });

    await backup(client, dbName, plans);
    for (const plan of plans) await apply(client, dbName, plan);
    return res.status(200).json({ dryRun: false, ...summary });
  } catch (error) {
    return sendError(res, error, "import");
  }
}
