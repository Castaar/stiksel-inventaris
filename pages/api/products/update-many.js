import { allowMethods, assertCollectionName, parseObjectId, sendError, HttpError } from "../../../lib/api";
import { getClient } from "../../../lib/mongodb";
import { moveHistory } from "../../../lib/history";
import { listCollectionNames } from "../../../lib/inventory";
import { cleanProductInput } from "../../../lib/product-input";
import { productTarget } from "../../../lib/product-api";

// Fields that are shared by several rows of a model; colour, size and stock stay per row
const SHARED_FIELDS = ["refnr", "modelnaam", "merk", "gender", "akp"];
const MAX_ROWS = 500;

// POST { db, collection, ids, fields, target_collection } changes several rows at once and/or moves
// them to another category. Only the fields that are sent change. A row keeps its _id when it moves.
export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;

  try {
    const { dbName, collectionName, collection } = await productTarget(req.body);
    const rawIds = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (!rawIds.length || rawIds.length > MAX_ROWS) throw new HttpError(400, "Kies minstens één rij");
    const ids = rawIds.map(parseObjectId);

    const input = req.body.fields && typeof req.body.fields === "object" ? req.body.fields : {};
    const picked = Object.fromEntries(SHARED_FIELDS.filter((key) => key in input).map((key) => [key, input[key]]));
    const set = cleanProductInput(picked, { partial: true });

    const target = req.body.target_collection ? assertCollectionName(req.body.target_collection) : collectionName;
    const moving = target !== collectionName;
    if (moving && !(await listCollectionNames(dbName)).includes(target)) throw new HttpError(404, `Categorie "${target}" bestaat niet`);

    const rows = await collection.find({ _id: { $in: ids } }).toArray();
    if (rows.length !== new Set(rawIds).size) throw new HttpError(404, "Een rij bestaat niet meer. Herlaad de pagina.");
    // Everything is checked before anything is written
    if (rows.some((row) => !({ ...row, ...set }).refnr && !({ ...row, ...set }).modelnaam)) {
      throw new HttpError(400, "Vul een refnr of een modelnaam in");
    }

    const now = new Date();
    if (moving) {
      const client = await getClient();
      const destination = client.db(dbName).collection(target);
      for (const row of rows) {
        await destination.insertOne({ ...row, ...set, updated_at: now });
        await collection.deleteOne({ _id: row._id });
      }
      await moveHistory(dbName, collectionName, target, rows.map((row) => row._id));
    } else if (Object.keys(set).length) {
      await collection.updateMany({ _id: { $in: ids } }, { $set: { ...set, updated_at: now } });
    }

    return res.status(200).json({ updated: rows.length, collection: target });
  } catch (error) {
    return sendError(res, error, "products/update-many");
  }
}
