import { allowMethods, sendError, HttpError } from "../../../lib/api";
import { historyEntry, recordHistory } from "../../../lib/history";
import { productId, productTarget } from "../../../lib/product-api";
import { toNumber, toNumberOrZero } from "../../../lib/product";

// POST { db, collection, _id, delta } adds (delta > 0) or takes out (delta < 0) pieces.
// One atomic update: two people tapping at the same time both count, and stock never goes below 0.
export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;

  try {
    const { dbName, collectionName, collection } = await productTarget(req.body);
    const _id = productId(req.body);
    const delta = toNumber(req.body?.delta);
    if (Number.isNaN(delta) || delta === 0 || Math.abs(delta) > 100000) {
      throw new HttpError(400, "Geef een aantal verschillend van 0");
    }

    // Older imports stored the stock as text ("12"): make it a number first, so $inc works
    const current = await collection.findOne({ _id }, { projection: { stock: 1 } });
    if (!current) throw new HttpError(404, "Product niet gevonden");
    if (typeof current.stock !== "number") {
      await collection.updateOne({ _id, stock: current.stock }, { $set: { stock: toNumberOrZero(current.stock) } });
    }

    const filter = { _id, ...(delta < 0 ? { stock: { $gte: -delta } } : {}) };
    const updated = await collection.findOneAndUpdate(
      filter,
      { $inc: { stock: delta }, $set: { updated_at: new Date() } },
      { returnDocument: "after" }
    );
    if (!updated) {
      const now = await collection.findOne({ _id }, { projection: { stock: 1 } });
      if (!now) throw new HttpError(404, "Product niet gevonden");
      throw new HttpError(409, `Er ${now.stock === 1 ? "is" : "zijn"} maar ${toNumberOrZero(now.stock)} stuks in stock`);
    }

    await recordHistory([
      historyEntry({
        db: dbName, collection: collectionName, product: updated,
        before: updated.stock - delta, after: updated.stock, source: delta > 0 ? "aanvullen" : "afboeken",
      }),
    ]);
    return res.status(200).json({ stock: updated.stock, updated_at: updated.updated_at });
  } catch (error) {
    return sendError(res, error, "products/adjust");
  }
}
