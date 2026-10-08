import { allowMethods, concurrencyFilter, sendError, HttpError, CONFLICT_MESSAGE } from "../../../lib/api";
import { historyEntry, recordHistory } from "../../../lib/history";
import { cleanProductInput } from "../../../lib/product-input";
import { productId, productTarget } from "../../../lib/product-api";
import { variantKey } from "../../../lib/product";

// POST { db, collection, _id, expected_updated_at, ...fields } changes only the fields that are sent
export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;

  try {
    const { dbName, collectionName, collection } = await productTarget(req.body);
    const _id = productId(req.body);
    const $set = { ...cleanProductInput(req.body, { partial: true }), updated_at: new Date() };

    // Renaming into another existing variant would make a duplicate
    const current = await collection.findOne({ _id });
    if (!current) throw new HttpError(404, "Product niet gevonden");
    const next = { ...current, ...$set };
    if (variantKey(next) !== variantKey(current)) {
      const others = await collection.find({ _id: { $ne: _id }, refnr: next.refnr }).toArray();
      if (others.some((doc) => variantKey(doc) === variantKey(next))) {
        throw new HttpError(409, "Er bestaat al een product met dezelfde refnr, kleur, maat en gender");
      }
    }

    const previous = await collection.findOneAndUpdate({ _id, ...concurrencyFilter(req.body) }, { $set });
    if (!previous) {
      const exists = await collection.countDocuments({ _id }, { limit: 1 });
      throw exists ? new HttpError(409, CONFLICT_MESSAGE) : new HttpError(404, "Product niet gevonden");
    }

    if ($set.stock !== undefined) {
      await recordHistory([
        historyEntry({
          db: dbName, collection: collectionName, product: { ...previous, ...$set },
          before: previous.stock, after: $set.stock, source: "aanpassen",
        }),
      ]);
    }
    return res.status(200).json({ updated_at: $set.updated_at });
  } catch (error) {
    return sendError(res, error, "products/update");
  }
}
