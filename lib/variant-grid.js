// The colour x size grid of the "new product" form (browser and tests)
import { toNumber } from "./product.js";

export const gridKey = (kleur, maat) => `${kleur}|${maat}`;

// "Navy, zwart" -> adds both to the list, without doubles (lower case, as stored)
export function addTags(list, input) {
  const next = [...list];
  for (const part of String(input).split(/[,;]/)) {
    const tag = part.trim().toLowerCase();
    if (tag && !next.includes(tag)) next.push(tag);
  }
  return next;
}

// The cells that were filled in: [{ kleur, maat, stock }]. A list without values counts as one empty value,
// so a product without colours or sizes is one cell. Returns null when a cell isn't a valid amount.
export function filledVariants(colors, sizes, quantities) {
  const out = [];
  for (const kleur of colors.length ? colors : [""]) {
    for (const maat of sizes.length ? sizes : [""]) {
      const raw = String(quantities[gridKey(kleur, maat)] ?? "").trim();
      if (!raw) continue;
      const stock = toNumber(raw);
      if (Number.isNaN(stock) || stock < 0) return null;
      if (stock > 0) out.push({ kleur, maat, stock });
    }
  }
  return out;
}
