import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { database } = req.query;
  const { collection } = req.body ?? {};

  if (!collection || typeof collection !== "string") {
    return res.status(400).json({ error: "Collectienaam is verplicht" });
  }

  const safeName = collection.trim().toLowerCase();

  try {
    const client = await clientPromise;
    const db = client.db(database);

    const existing = await db.listCollections({ name: safeName }).toArray();
    if (existing.length > 0) {
      return res.status(409).json({ error: "Collectie bestaat al" });
    }

    // MongoDB creates a collection implicitly on first insert; use createCollection to create it explicitly
    await db.createCollection(safeName);

    return res.status(201).json({ ok: true, collection: safeName });
  } catch (e) {
    console.error(`[API POST ${database}] error:`, e.message);
    return res.status(500).json({ error: "Interne serverfout" });
  }
}
