import { allowMethods, parseObjectId, sendError, HttpError } from "../../../lib/api";
import { historyEntry, recordHistory } from "../../../lib/history";
import { productTarget } from "../../../lib/product-api";
import { mergeProblem, toNumberOrZero, variantKey } from "../../../lib/product";

const MAX_ROWS = 200;
// Fields the row that stays takes over from the others when it has none itself
const FILL_FIELDS = ["merk", "akp", "leverdatum"];

// POST { db, collection, ids } makes one row of rows that are the same product: the first stays,
// the pieces of the others are added to it. Refused when the rows differ in name, price or variant.
export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;

  try {
    const { dbName, collectionName, collection } = await productTarget(req.body);
    const rawIds = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (new Set(rawIds).size !== rawIds.length || rawIds.length < 2 || rawIds.length > MAX_ROWS) {
      throw new HttpError(400, "Kies minstens twee verschillende rijen");
    }
    const ids = rawIds.map(parseObjectId);

    const found = await collection.find({ _id: { $in: ids } }).toArray();
    if (found.length !== ids.length) throw new HttpError(404, "Een rij bestaat niet meer. Herlaad de pagina.");
    const rows = ids.map((id) => found.find((doc) => doc._id.equals(id)));
    if (new Set(rows.map(variantKey)).size > 1) throw new HttpError(400, "Deze rijen zijn niet hetzelfde product");
    const problem = mergeProblem(rows);
    if (problem) throw new HttpError(409, problem);

    const [keep, ...others] = rows;
    const $set = { updated_at: new Date() };
    for (const field of FILL_FIELDS) {
      const value = rows.find((row) => row[field])?.[field];
      if (!keep[field] && value) $set[field] = value;
    }
    if (!keep.lang_in_stock && rows.some((row) => row.lang_in_stock)) $set.lang_in_stock = true;
    // Older imports stored the stock as text ("12"): make it a number first, so $inc works
    const before = toNumberOrZero(keep.stock);
    await collection.updateOne({ _id: keep._id }, { $set: typeof keep.stock === "number" ? $set : { ...$set, stock: before } });

    // Row by row and with the amount of the row that was really removed, so a change in the meantime isn't lost
    const history = [];
    let added = 0;
    for (const other of others) {
      const removed = await collection.findOneAndDelete({ _id: other._id });
      if (!removed) continue;
      const stock = toNumberOrZero(removed.stock);
      if (stock) await collection.updateOne({ _id: keep._id }, { $inc: { stock } });
      added += stock;
      history.push(historyEntry({ db: dbName, collection: collectionName, product: removed, before: stock, after: 0, source: "verwijderd" }));
    }

    const merged = await collection.findOne({ _id: keep._id });
    history.unshift(historyEntry({ db: dbName, collection: collectionName, product: merged, before, after: before + added, source: "samenvoegen" }));
    await recordHistory(history);
    return res.status(200).json({ kept: keep._id, stock: merged.stock, merged: others.length });
  } catch (error) {
    return sendError(res, error, "products/merge");
  }
}
