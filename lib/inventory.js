// Server-side data access shared by the pages and the API (never import in browser code)
import { getClient } from "./mongodb";
import { HttpError, assertDatabaseName, isInventoryDatabase } from "./api";
import { hasPrice, productValue, variantKey } from "./product";
import { loadSettings } from "./settings";

// Plain JSON for props (ObjectId -> string, Date -> ISO string)
export function toProps(value) {
  return JSON.parse(JSON.stringify(value));
}

// Every inventory database on the cluster, alphabetically
export async function listDatabaseNames() {
  const client = await getClient();
  const { databases } = await client.db().admin().listDatabases({ nameOnly: true });
  return databases
    .map((db) => db.name)
    .filter(isInventoryDatabase)
    .sort((a, b) => a.localeCompare(b));
}

// The database name from a request, only when it exists (no new databases from a typo in a URL)
export async function existingDatabase(name) {
  assertDatabaseName(name);
  if (!(await listDatabaseNames()).includes(name)) throw new HttpError(404, `Database "${name}" bestaat niet`);
  return name;
}

export async function listCollectionNames(dbName) {
  const client = await getClient();
  const collections = await client.db(dbName).listCollections({}, { nameOnly: true }).toArray();
  return collections
    .map((c) => c.name)
    .filter((name) => !name.startsWith("system."))
    .sort((a, b) => a.localeCompare(b));
}

// Every product of a database with its category, value and flags, for the dashboard
export async function listAllProducts(dbName, settings = {}) {
  const lowBelow = settings.low_stock_below || 0;
  const client = await getClient();
  const db = client.db(dbName);
  const names = await listCollectionNames(dbName);
  const perCollection = await Promise.all(
    names.map(async (name) => {
      const docs = await db.collection(name).find({}).toArray();
      const counts = new Map();
      docs.forEach((doc) => counts.set(variantKey(doc), (counts.get(variantKey(doc)) || 0) + 1));
      return docs.map((doc) => ({
        ...doc,
        db: dbName,
        collection: name,
        value: productValue(doc),
        has_price: hasPrice(doc),
        duplicate: counts.get(variantKey(doc)) > 1,
        low_below: lowBelow,
      }));
    })
  );
  return { collections: names, products: perCollection.flat(), low_stock_below: lowBelow };
}

// All inventories: { [db]: { collections, products } }
export async function loadInventories() {
  const [names, settings] = await Promise.all([listDatabaseNames(), loadSettings()]);
  const parts = await Promise.all(names.map((name) => listAllProducts(name, settings[name])));
  return Object.fromEntries(names.map((name, i) => [name, parts[i]]));
}
