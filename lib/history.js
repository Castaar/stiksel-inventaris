// History of every change in a product's stock (server only).
// The API routes write an entry after each change; the history page and the product drawer read them.
import { ObjectId } from "mongodb";
import { getClient } from "./mongodb";
import { SETTINGS_DB } from "./api";
import { HISTORY_SOURCES } from "./stock-view.js";
import { toNumberOrZero } from "./product.js";

const HISTORY_COLLECTION = "stock_history";

const round = (n) => Math.round(n * 1000) / 1000;

let indexes;

async function historyCollection() {
  const client = await getClient();
  const collection = client.db(SETTINGS_DB).collection(HISTORY_COLLECTION);
  indexes ??= collection
    .createIndexes([{ key: { at: -1 } }, { key: { product_id: 1, _id: -1 } }])
    .catch((error) => {
      indexes = undefined;
      console.error("history: creating indexes failed:", error.message);
    });
  await indexes;
  return collection;
}

// One history entry, or null when the stock didn't change
export function historyEntry({ db, collection, product, before, after, source }) {
  const from = round(toNumberOrZero(before));
  const to = round(toNumberOrZero(after));
  if (from === to) return null;
  return {
    at: new Date(),
    db,
    collection,
    product_id: String(product._id),
    refnr: product.refnr || "",
    name: product.modelnaam || product.refnr || "",
    kleur: product.kleur || "",
    maat: product.maat || "",
    before: from,
    after: to,
    delta: round(to - from),
    source,
  };
}

// Never fails the change itself: a missing history entry is logged, not thrown
export async function recordHistory(entries) {
  const list = entries.filter(Boolean);
  if (!list.length) return;
  try {
    await (await historyCollection()).insertMany(list, { ordered: false });
  } catch (error) {
    console.error("history: saving failed:", error.message);
  }
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Newest first. `before` (the _id of the last entry shown) loads the next page.
export async function listHistory({ db, search, source, before, limit = 200 } = {}) {
  const filter = {};
  if (db) filter.db = db;
  if (source && HISTORY_SOURCES[source]) filter.source = source;
  if (before && ObjectId.isValid(before)) filter._id = { $lt: new ObjectId(before) };
  if (search) {
    // Every word must match one of the fields: "jh001 navy" finds the navy variants of jh001
    filter.$and = search
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => {
        const pattern = new RegExp(escapeRegExp(word), "i");
        return { $or: ["name", "refnr", "kleur", "maat", "collection"].map((field) => ({ [field]: pattern })) };
      });
  }
  return (await historyCollection()).find(filter).sort({ _id: -1 }).limit(limit).toArray();
}

export async function productHistory(db, collection, productId, limit = 50) {
  return (await historyCollection())
    .find({ db, collection, product_id: String(productId) })
    .sort({ _id: -1 })
    .limit(limit)
    .toArray();
}

// Most used products: the pieces taken out by hand (not deletions or imports)
export async function topUsage({ days = 30, limit = 10 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return (await historyCollection())
    .aggregate([
      { $match: { at: { $gte: since }, source: "afboeken", delta: { $lt: 0 } } },
      { $sort: { at: 1 } },
      {
        $group: {
          _id: { db: "$db", collection: "$collection", product_id: "$product_id" },
          name: { $last: "$name" },
          refnr: { $last: "$refnr" },
          kleur: { $last: "$kleur" },
          maat: { $last: "$maat" },
          used: { $sum: { $multiply: ["$delta", -1] } },
          times: { $sum: 1 },
        },
      },
      { $sort: { times: -1, used: -1 } },
      { $limit: limit },
    ])
    .toArray();
}
