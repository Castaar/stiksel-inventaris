import { allowMethods, sendError } from "../../lib/api";
import { existingDatabase } from "../../lib/inventory";
import { saveLowStock } from "../../lib/settings";

// POST { db, low_stock_below } sets from how many pieces down products count as "bijna op" (0 = never)
export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;

  try {
    const db = await existingDatabase(req.body?.db);
    const below = await saveLowStock(db, req.body?.low_stock_below);
    return res.status(200).json({ db, low_stock_below: below });
  } catch (error) {
    return sendError(res, error, "settings");
  }
}
