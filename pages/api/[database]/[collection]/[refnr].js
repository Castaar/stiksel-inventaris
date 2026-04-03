import clientPromise from "../../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { database, collection, refnr: slug } = req.query;
  const lastDash = slug.lastIndexOf('-');
  const refnr = slug.substring(0, lastDash);
  const colorInitial = slug.substring(lastDash + 1).replace(/[^a-z]/g, '');
  const updates = req.body;

  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  // Strip _id to prevent overwriting it
  const { _id, ...safeUpdates } = updates;

  const textFields = ["refnr", "modelnaam", "kleur", "gender", "maat"];
  for (const field of textFields) {
    if (typeof safeUpdates[field] === "string") safeUpdates[field] = safeUpdates[field].toLowerCase();
  }

  if (safeUpdates.stock !== undefined) safeUpdates.stock = Number(String(safeUpdates.stock).replace(",", "."));
  if (safeUpdates.akp !== undefined) safeUpdates.akp = Number(String(safeUpdates.akp).replace(",", "."));

  try {
    const client = await clientPromise;
    const db = client.db(database);

    const query = { refnr, ...(colorInitial ? { kleur: { $regex: `^${colorInitial}` } } : {}) };
    const result = await db.collection(collection).updateOne(
      query,
      { $set: safeUpdates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Document niet gevonden" });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(`[API ${database}/${collection}/${refnr}] error:`, e.message);
    return res.status(500).json({ error: "Interne serverfout" });
  }
}
