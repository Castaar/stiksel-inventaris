// Settings per inventory (server only), stored in our own database
import { getClient } from "./mongodb";
import { SETTINGS_DB } from "./api";
import { lowStockBelow } from "./product";

async function settingsCollection() {
  const client = await getClient();
  return client.db(SETTINGS_DB).collection("inventory_settings");
}

// { [db]: { low_stock_below } }
export async function loadSettings() {
  const docs = await (await settingsCollection()).find({}).toArray();
  return Object.fromEntries(docs.map(({ _id, ...settings }) => [_id, settings]));
}

export async function saveLowStock(db, value) {
  const below = lowStockBelow(value);
  await (await settingsCollection()).updateOne({ _id: db }, { $set: { low_stock_below: below } }, { upsert: true });
  return below;
}
