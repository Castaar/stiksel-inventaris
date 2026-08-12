import clientPromise from "../../../lib/mongodb";

// TEMPORARY endpoint: drops every collection in the given database.
// Remove this route + the button in pages/[database]/index.js once no longer needed.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { database } = req.query;

  try {
    const client = await clientPromise;
    const db = client.db(database);

    const collectionList = await db.listCollections().toArray();
    for (const col of collectionList) {
      await db.collection(col.name).drop();
    }

    return res.status(200).json({ ok: true, dropped: collectionList.map((c) => c.name) });
  } catch (e) {
    console.error(`[API clean ${database}] error:`, e.message);
    return res.status(500).json({ error: "Interne serverfout" });
  }
}
