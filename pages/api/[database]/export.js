import clientPromise from "../../../lib/mongodb";

function csvEscape(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { database } = req.query;

  try {
    const client = await clientPromise;
    const db = client.db(database);

    const collectionList = await db.listCollections().toArray();
    const sortedCollections = collectionList.sort((a, b) => a.name.localeCompare(b.name));

    const headers = ["collectie", "refnr", "modelnaam", "merk", "kleur", "gender", "maat", "stock", "akp"];
    const lines = [headers.join(",")];

    for (const col of sortedCollections) {
      const docs = await db.collection(col.name).find({}).toArray();
      for (const doc of docs) {
        lines.push(
          [
            col.name,
            doc.refnr ?? "",
            doc.modelnaam ?? "",
            doc.merk ?? "",
            doc.kleur ?? "",
            doc.gender ?? "",
            doc.maat ?? "",
            doc.stock ?? "",
            doc.akp ?? "",
          ]
            .map(csvEscape)
            .join(",")
        );
      }
    }

    const csv = lines.join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${database}.csv"`);
    return res.status(200).send(csv);
  } catch (e) {
    console.error(`[API export ${database}] error:`, e.message);
    return res.status(500).json({ error: "Interne serverfout" });
  }
}
