import clientPromise from "../../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { database, collection } = req.query;
  const doc = req.body;

  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { _id, ...safeDoc } = doc;

  const textFields = ["refnr", "modelnaam", "merk", "kleur", "gender", "maat"];
  for (const field of textFields) {
    if (typeof safeDoc[field] === "string") safeDoc[field] = safeDoc[field].toLowerCase();
  }

  if (safeDoc.stock !== undefined) safeDoc.stock = Number(String(safeDoc.stock).replace(",", "."));
  if (safeDoc.akp !== undefined) safeDoc.akp = Number(String(safeDoc.akp).replace(",", "."));

  if (!safeDoc.refnr) {
    return res.status(400).json({ error: "Refnr is verplicht" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(database);

    await db.collection(collection).insertOne(safeDoc);

    return res.status(201).json({ ok: true, refnr: safeDoc.refnr });
  } catch (e) {
    console.error(`[API POST ${database}/${collection}] error:`, e.message);
    return res.status(500).json({ error: "Interne serverfout" });
  }
}
