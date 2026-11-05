import { allowMethods, parseObjectId, sendError, HttpError } from "../../../lib/api";
import { historyEntry, recordHistory } from "../../../lib/history";
import { cleanProductInput } from "../../../lib/product-input";
import { productTarget } from "../../../lib/product-api";
import { mergeProblem, toNumberOrZero, variantKey } from "../../../lib/product";

const MAX_VARIANTS = 500;

// POST { db, collection, ids, variants: [{ kleur, maat, stock }] } divides the pieces of rows (e.g. "kleur onbekend")
// over real colours and sizes. What isn't divided stays in the first row; a row that ends up empty disappears.
export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;

  try {
    const { dbName, collectionName, collection } = await productTarget(req.body);
    const rawIds = Array.isArray(req.body.ids) ? req.body.ids : [];
    const variants = Array.isArray(req.body.variants) ? req.body.variants : [];
    if (!rawIds.length || new Set(rawIds).size !== rawIds.length) throw new HttpError(400, "Kies minstens één rij");
    if (!variants.length || variants.length > MAX_VARIANTS) throw new HttpError(400, "Vul minstens één aantal in");
    const ids = rawIds.map(parseObjectId);

    const found = await collection.find({ _id: { $in: ids } }).toArray();
    if (found.length !== ids.length) throw new HttpError(404, "Een rij bestaat niet meer. Herlaad de pagina.");
    const sources = ids.map((id) => found.find((doc) => doc._id.equals(id)));
    if (new Set(sources.map(variantKey)).size > 1) throw new HttpError(400, "Deze rijen zijn niet hetzelfde product");
    const problem = mergeProblem(sources);
    if (problem) throw new HttpError(409, problem);

    const [first, ...others] = sources;
    const { refnr, modelnaam, merk, gender, akp, leverdatum, lang_in_stock } = first;
    const shared = { refnr, modelnaam, merk, gender, akp, leverdatum, lang_in_stock };
    // Everything is checked before anything is written
    const products = variants.map((variant) => cleanProductInput({ ...shared, kleur: variant.kleur, maat: variant.maat, stock: variant.stock }));
    if (products.some((product) => !(product.stock > 0))) throw new HttpError(400, "Elk aantal moet groter dan 0 zijn");
    const sourceKey = variantKey(first);
    if (products.some((product) => variantKey(product) === sourceKey)) throw new HttpError(400, "Kies een andere kleur of maat dan de rij die je verdeelt");

    const total = sources.reduce((n, row) => n + toNumberOrZero(row.stock), 0);
    const divided = products.reduce((n, product) => n + product.stock, 0);
    if (divided > total) throw new HttpError(400, `Er zijn maar ${total} stuks om te verdelen`);

    const sourceIds = new Set(sources.map((row) => String(row._id)));
    const existing = await collection.find(refnr ? { refnr } : { modelnaam }).toArray();
    const known = new Map(existing.filter((doc) => !sourceIds.has(String(doc._id))).map((doc) => [variantKey(doc), doc]));

    const now = new Date();
    const history = [];
    const source = { db: dbName, collection: collectionName, source: "verdelen" };

    // New rows first: if something goes wrong halfway, no pieces are lost
    for (const product of products) {
      const key = variantKey(product);
      const doc = known.get(key);
      if (doc) {
        if (typeof doc.stock !== "number") await collection.updateOne({ _id: doc._id, stock: doc.stock }, { $set: { stock: toNumberOrZero(doc.stock) } });
        const updated = await collection.findOneAndUpdate({ _id: doc._id }, { $inc: { stock: product.stock }, $set: { updated_at: now } }, { returnDocument: "after" });
        history.push(historyEntry({ ...source, product: updated, before: updated.stock - product.stock, after: updated.stock }));
      } else {
        const toInsert = { ...product, updated_at: now };
        const { insertedId } = await collection.insertOne(toInsert);
        known.set(key, { ...toInsert, _id: insertedId });
        history.push(historyEntry({ ...source, product: { ...toInsert, _id: insertedId }, before: 0, after: product.stock }));
      }
    }

    const remaining = Math.round((total - divided) * 1000) / 1000;
    if (remaining > 0) await collection.updateOne({ _id: first._id }, { $set: { stock: remaining, updated_at: now } });
    else await collection.deleteOne({ _id: first._id });
    history.push(historyEntry({ ...source, product: first, before: toNumberOrZero(first.stock), after: remaining }));
    for (const other of others) {
      await collection.deleteOne({ _id: other._id });
      history.push(historyEntry({ ...source, product: other, before: toNumberOrZero(other.stock), after: 0 }));
    }

    await recordHistory(history);
    return res.status(200).json({ divided, remaining });
  } catch (error) {
    return sendError(res, error, "products/split");
  }
}
