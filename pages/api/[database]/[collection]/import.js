import { IncomingForm } from "formidable";
import fs from "fs";
import clientPromise from "../../../../lib/mongodb";

export const config = { api: { bodyParser: false } };

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const doc = {};
    headers.forEach((header, i) => {
      doc[header] = values[i] ?? "";
    });
    return doc;
  });
}

const textFields = ["refnr", "modelnaam", "kleur", "gender", "maat"];

function sanitize(doc) {
  const out = { ...doc };
  for (const field of textFields) {
    if (typeof out[field] === "string") out[field] = out[field].toLowerCase();
  }
  if (out.stock !== undefined) out.stock = Number(String(out.stock).replace(",", "."));
  if (out.akp !== undefined) out.akp = Number(String(out.akp).replace(",", "."));
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { database, collection } = req.query;

  const form = new IncomingForm({ maxFileSize: 5 * 1024 * 1024 });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Bestand kon niet worden verwerkt" });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ error: "Geen bestand gevonden" });
    }

    const text = fs.readFileSync(file.filepath, "utf-8");
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return res.status(400).json({ error: "CSV is leeg of ongeldig" });
    }

    const docs = rows.map(sanitize).filter((d) => d.refnr);

    try {
      const client = await clientPromise;
      const db = client.db(database);

      await db.collection(collection).deleteMany({});
      const result = await db.collection(collection).insertMany(docs, { ordered: false });

      return res.status(201).json({ ok: true, inserted: result.insertedCount });
    } catch (e) {
      // ordered: false — partial inserts possible; report what was inserted
      const inserted = e.result?.insertedCount ?? 0;
      console.error(`[API CSV ${database}/${collection}] error:`, e.message);
      return res.status(207).json({ ok: true, inserted, warning: "Sommige rijen konden niet worden ingevoerd" });
    }
  });
}
