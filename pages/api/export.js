import { allowMethods, assertCollectionName, sendError } from "../../lib/api";
import { existingDatabase, listAllProducts, listDatabaseNames } from "../../lib/inventory";
import { toCsv } from "../../lib/csv";
import { sortProducts } from "../../lib/stock-view";

// The import reads these columns back; "waarde" is only for reading, "id" and "versie" let the
// import find the product again and skip rows that changed in the app after the export.
const COLUMNS = ["collectie", "refnr", "modelnaam", "merk", "kleur", "gender", "maat", "stock", "akp", "waarde", "leverdatum", "lang_in_stock", "id", "versie"];

const decimal = (n) => (n === null || n === undefined || n === "" ? "" : String(Math.round(Number(n) * 100) / 100));

function row(product) {
  return [
    product.collection,
    product.refnr,
    product.modelnaam,
    product.merk,
    product.kleur,
    product.gender,
    product.maat,
    decimal(product.stock),
    decimal(product.akp),
    decimal(product.value),
    product.leverdatum || "",
    product.lang_in_stock ? "ja" : "",
    String(product._id),
    product.updated_at ? new Date(product.updated_at).toISOString() : "",
  ];
}

// GET ?db=&collection= : CSV of one category, one database or (without db) every database
export default async function handler(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;

  try {
    const dbNames = req.query.db ? [await existingDatabase(req.query.db)] : await listDatabaseNames();
    const collection = req.query.collection ? assertCollectionName(req.query.collection) : null;
    const withDatabase = dbNames.length > 1 || !req.query.db;

    const rows = [];
    for (const dbName of dbNames) {
      const { products } = await listAllProducts(dbName);
      const shown = collection ? products.filter((p) => p.collection === collection) : products;
      const byCollection = (a, b) => a.collection.localeCompare(b.collection);
      for (const product of sortProducts(shown, "naam").sort(byCollection)) {
        rows.push(withDatabase ? [dbName, ...row(product)] : row(product));
      }
    }

    const headers = withDatabase ? ["database", ...COLUMNS] : COLUMNS;
    const date = new Date().toISOString().slice(0, 10);
    const name = [req.query.db || "stiksel", collection, date].filter(Boolean).join("-");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${name.replace(/[^\w.-]/g, "_")}.csv"`);
    return res.status(200).send(toCsv(headers, rows));
  } catch (error) {
    return sendError(res, error, "export");
  }
}
