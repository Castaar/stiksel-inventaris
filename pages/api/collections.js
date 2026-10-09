import { getClient } from "../../lib/mongodb";
import { existingDatabase, listDatabaseNames } from "../../lib/inventory";
import { allowMethods, assertCollectionName, assertDatabaseName, normalizeNewCollectionName, sendError, HttpError } from "../../lib/api";

async function exists(db, name) {
  const found = await db.listCollections({ name }, { nameOnly: true }).toArray();
  return found.length > 0;
}

// Category management: { db, action: "create" | "rename" | "delete", name, newName }.
// "create-database" makes a new inventory with its first category (MongoDB only keeps a database with a collection).
export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;

  try {
    const { action } = req.body || {};

    if (action === "create-database") {
      const dbName = assertDatabaseName(normalizeNewCollectionName(req.body.db));
      if ((await listDatabaseNames()).includes(dbName)) throw new HttpError(409, `Inventaris "${dbName}" bestaat al`);
      const name = normalizeNewCollectionName(req.body.name);
      const client = await getClient();
      await client.db(dbName).createCollection(name);
      return res.status(201).json({ db: dbName, name });
    }

    const dbName = await existingDatabase(req.body?.db);
    const client = await getClient();
    const db = client.db(dbName);

    if (action === "create") {
      const name = normalizeNewCollectionName(req.body.name);
      if (await exists(db, name)) throw new HttpError(409, `Categorie "${name}" bestaat al`);
      await db.createCollection(name);
      return res.status(201).json({ name });
    }

    const name = assertCollectionName(req.body?.name);
    if (!(await exists(db, name))) throw new HttpError(404, "Categorie niet gevonden");

    if (action === "rename") {
      const newName = normalizeNewCollectionName(req.body.newName);
      if (newName === name) return res.status(200).json({ name });
      if (await exists(db, newName)) throw new HttpError(409, `Categorie "${newName}" bestaat al`);
      await db.collection(name).rename(newName);
      return res.status(200).json({ name: newName });
    }

    if (action === "delete") {
      // Only empty categories can be deleted, so no stock disappears by accident
      const count = await db.collection(name).countDocuments({}, { limit: 1 });
      if (count > 0) throw new HttpError(409, "Categorie is niet leeg: verwijder of verplaats eerst de producten");
      await db.collection(name).drop();
      return res.status(200).json({ deleted: name });
    }

    throw new HttpError(400, "Onbekende actie");
  } catch (error) {
    return sendError(res, error, "collections");
  }
}
