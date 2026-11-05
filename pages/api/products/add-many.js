import { allowMethods, sendError, HttpError } from "../../../lib/api";
import { historyEntry, recordHistory } from "../../../lib/history";
import { cleanProductInput } from "../../../lib/product-input";
import { productTarget } from "../../../lib/product-api";
import { toNumberOrZero, variantKey } from "../../../lib/product";

const MAX_VARIANTS = 500;

// POST { db, collection, ...fields, variants: [{ kleur, maat, stock }] } adds one model in several colours and
// sizes at once: a variant that already exists gets the pieces added, the others are created.
export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;

  try {
    const { dbName, collectionName, collection } = await productTarget(req.body);
    const { variants, _id, ...fields } = req.body;
    if (!Array.isArray(variants) || !variants.length) throw new HttpError(400, "Vul minstens één aantal in");
    if (variants.length > MAX_VARIANTS) throw new HttpError(400, `Maximaal ${MAX_VARIANTS} varianten tegelijk`);

    // Everything is checked before anything is written
    const products = variants.map((variant) => cleanProductInput({ ...fields, kleur: variant.kleur, maat: variant.maat, stock: variant.stock }));
    if (products.some((product) => !(product.stock > 0))) throw new HttpError(400, "Elk aantal moet groter dan 0 zijn");
    const { refnr, modelnaam } = products[0];

    const existing = await collection.find(refnr ? { refnr } : { modelnaam }).toArray();
    const known = new Map(existing.map((doc) => [variantKey(doc), doc]));

    const now = new Date();
    const history = [];
    const ids = [];
    let created = 0;
    let added = 0;

    for (const product of products) {
      const key = variantKey(product);
      const doc = known.get(key);
      if (doc) {
        // Older imports stored the stock as text ("12"): make it a number first, so $inc works
        if (typeof doc.stock !== "number") await collection.updateOne({ _id: doc._id, stock: doc.stock }, { $set: { stock: toNumberOrZero(doc.stock) } });
        const updated = await collection.findOneAndUpdate(
          { _id: doc._id },
          { $inc: { stock: product.stock }, $set: { updated_at: now } },
          { returnDocument: "after" }
        );
        history.push(historyEntry({ db: dbName, collection: collectionName, product: updated, before: updated.stock - product.stock, after: updated.stock, source: "aanvullen" }));
        ids.push(doc._id);
        added++;
      } else {
        const toInsert = { ...product, updated_at: now };
        const { insertedId } = await collection.insertOne(toInsert);
        // The same variant twice in one request is added up
        known.set(key, { ...toInsert, _id: insertedId });
        history.push(historyEntry({ db: dbName, collection: collectionName, product: { ...toInsert, _id: insertedId }, before: 0, after: product.stock, source: "nieuw" }));
        ids.push(insertedId);
        created++;
      }
    }

    await recordHistory(history);
    return res.status(200).json({ created, added, ids });
  } catch (error) {
    return sendError(res, error, "products/add-many");
  }
}
