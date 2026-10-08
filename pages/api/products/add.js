import { allowMethods, sendError } from "../../../lib/api";
import { historyEntry, recordHistory } from "../../../lib/history";
import { cleanProductInput } from "../../../lib/product-input";
import { productTarget } from "../../../lib/product-api";
import { TEXT_FIELDS, variantKey } from "../../../lib/product";

// POST { db, collection, ...fields } creates a product
export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;

  try {
    const { dbName, collectionName, collection } = await productTarget(req.body);
    const product = { ...cleanProductInput(req.body), updated_at: new Date() };

    // The same refnr, colour, size and gender already exists: add to that one instead
    const existing = await collection
      .find({ refnr: product.refnr }, { projection: Object.fromEntries(TEXT_FIELDS.map((key) => [key, 1])) })
      .toArray();
    const duplicate = existing.find((doc) => variantKey(doc) === variantKey(product));
    if (duplicate) {
      return res.status(409).json({
        error: "Dit product (zelfde refnr, kleur, maat en gender) bestaat al. Vul de stock daar aan.",
        productId: duplicate._id,
      });
    }

    const { insertedId } = await collection.insertOne(product);
    await recordHistory([
      historyEntry({
        db: dbName, collection: collectionName, product: { ...product, _id: insertedId },
        before: 0, after: product.stock, source: "nieuw",
      }),
    ]);
    return res.status(201).json({ productId: insertedId });
  } catch (error) {
    return sendError(res, error, "products/add");
  }
}
