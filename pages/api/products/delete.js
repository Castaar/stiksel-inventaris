import { allowMethods, sendError, HttpError } from "../../../lib/api";
import { historyEntry, recordHistory } from "../../../lib/history";
import { productId, productTarget } from "../../../lib/product-api";

// POST { db, collection, _id }
export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST", "DELETE"])) return;

  try {
    const { dbName, collectionName, collection } = await productTarget(req.body);
    const deleted = await collection.findOneAndDelete({ _id: productId(req.body) });
    if (!deleted) throw new HttpError(404, "Product niet gevonden");

    await recordHistory([
      historyEntry({
        db: dbName, collection: collectionName, product: deleted,
        before: deleted.stock, after: 0, source: "verwijderd",
      }),
    ]);
    return res.status(200).json({ deleted: true });
  } catch (error) {
    return sendError(res, error, "products/delete");
  }
}
