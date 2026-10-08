import { allowMethods, assertCollectionName, assertDatabaseName, parseObjectId, sendError } from "../../lib/api";
import { productHistory } from "../../lib/history";

// GET ?db=&collection=&id= returns the latest stock changes of one product
export default async function handler(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;

  try {
    const db = assertDatabaseName(req.query.db);
    const collection = assertCollectionName(req.query.collection);
    const id = parseObjectId(req.query.id).toString();
    const entries = await productHistory(db, collection, id, 10);
    return res.status(200).json({ entries });
  } catch (error) {
    return sendError(res, error, "history");
  }
}
