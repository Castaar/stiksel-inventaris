import { IncomingForm } from "formidable";
import fs from "fs";
import clientPromise from "../../../lib/mongodb";

export const config = { api: { bodyParser: false } };

function parseCSVLine(line) {
  // Basic CSV parser that supports quoted fields containing commas.
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const doc = {};
    headers.forEach((header, i) => {
      doc[header] = values[i] ?? "";
    });
    return doc;
  });
}

const textFields = ["refnr", "modelnaam", "merk", "kleur", "gender", "maat"];

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

  const { database } = req.query;

  const form = new IncomingForm({ maxFileSize: 10 * 1024 * 1024 });

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

    // Group rows by their "collectie" column so each collection is imported separately.
    const byCollection = {};
    for (const row of rows) {
      const { collectie, ...rest } = row;
      const colName = (collectie ?? "").trim().toLowerCase();
      if (!colName) continue;

      const doc = sanitize(rest);
      if (!doc.refnr) continue;

      if (!byCollection[colName]) byCollection[colName] = [];
      byCollection[colName].push(doc);
    }

    const collectionNames = Object.keys(byCollection);
    if (collectionNames.length === 0) {
      return res.status(400).json({
        error: "Geen geldige rijen gevonden (kolom 'collectie' ontbreekt of refnr is leeg)",
      });
    }

    try {
      const client = await clientPromise;
      const db = client.db(database);

      let totalInserted = 0;
      const warnings = [];

      for (const colName of collectionNames) {
        const docs = byCollection[colName];
        await db.collection(colName).deleteMany({});
        try {
          const result = await db.collection(colName).insertMany(docs, { ordered: false });
          totalInserted += result.insertedCount;
        } catch (e) {
          const inserted = e.result?.insertedCount ?? 0;
          totalInserted += inserted;
          warnings.push(colName);
        }
      }

      if (warnings.length > 0) {
        return res.status(207).json({
          ok: true,
          inserted: totalInserted,
          warning: `Sommige rijen in ${warnings.join(", ")} konden niet worden ingevoerd`,
        });
      }

      return res.status(201).json({ ok: true, inserted: totalInserted });
    } catch (e) {
      console.error(`[API import ${database}] error:`, e.message);
      return res.status(500).json({ error: "Interne serverfout" });
    }
  });
}
