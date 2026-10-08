// Validation of product input from the forms and the CSV import (server only)
import { HttpError } from "./api";
import { TEXT_FIELDS, toNumber } from "./product";

// Delivery date ("leverdatum"), stored as "YYYY-MM-DD"; "" clears it. Undefined when not sent.
// Also accepts "31/01/2026" as Excel writes it in Belgium.
export function parseDeliveryDate(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return "";
  const raw = String(value).trim();
  const be = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  const iso = be ? `${be[3]}-${be[2].padStart(2, "0")}-${be[1].padStart(2, "0")}` : raw;
  const date = new Date(`${iso}T00:00:00Z`);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(date.getTime()) && date.toISOString().startsWith(iso);
  if (!valid) throw new HttpError(400, "Leverdatum moet een datum zijn (JJJJ-MM-DD)");
  return iso;
}

// Checkbox values from the form or a CSV cell. Undefined when not sent.
export function parseFlag(value) {
  if (value === undefined) return undefined;
  return [true, 1, "true", "TRUE", "1", "ja", "Ja", "JA", "x", "X"].includes(value);
}

// The fields to store from a request body. `partial` only returns the fields that were sent
// (editing); otherwise every field gets a value (a new product).
export function cleanProductInput(body, { partial = false } = {}) {
  const input = body && typeof body === "object" ? body : {};
  const out = {};

  for (const key of TEXT_FIELDS) {
    const value = input[key];
    if (value === undefined && partial) continue;
    if (value !== undefined && value !== null && typeof value !== "string" && typeof value !== "number") {
      throw new HttpError(400, `${key} moet tekst zijn`);
    }
    out[key] = String(value ?? "").trim().toLowerCase().slice(0, 120);
  }
  if ("refnr" in out && !out.refnr) throw new HttpError(400, "Refnr is verplicht");

  if (input.stock !== undefined || !partial) {
    const stock = input.stock === undefined || input.stock === "" ? 0 : toNumber(input.stock);
    if (Number.isNaN(stock) || stock < 0) throw new HttpError(400, "Stock moet een getal vanaf 0 zijn");
    out.stock = stock;
  }

  if (input.akp !== undefined || !partial) {
    const akp = input.akp === undefined || input.akp === null || input.akp === "" ? null : toNumber(input.akp);
    if (akp !== null && (Number.isNaN(akp) || akp < 0)) throw new HttpError(400, "AKP moet een bedrag vanaf 0 zijn");
    out.akp = akp;
  }

  const leverdatum = parseDeliveryDate(input.leverdatum);
  if (leverdatum !== undefined) out.leverdatum = leverdatum;
  else if (!partial) out.leverdatum = "";

  const langInStock = parseFlag(input.lang_in_stock);
  if (langInStock !== undefined) out.lang_in_stock = langInStock;
  else if (!partial) out.lang_in_stock = false;

  return out;
}
