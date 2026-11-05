// Groups the variants (one per colour and size) into models: one card per refnr (browser and server)
import { compareSizes, mergeProblem, text, variantKey } from "./product.js";
import { productTitle, quantity, status, updatedAt } from "./stock-view.js";

export function modelKey(product) {
  const id = product.refnr || product.modelnaam || product._id;
  return `${product.db}:${product.collection}:${id}`;
}

const byText = (a, b) => String(a || "").localeCompare(String(b || ""), "nl", { numeric: true });

// [{ key, db, collection, refnr, title, merk, variants, colors, sizes, stock, value, ... }]
export function groupModels(products) {
  const groups = new Map();
  for (const product of products) {
    const key = modelKey(product);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(product);
  }
  return [...groups].map(([key, variants]) => {
    const first = variants[0];
    const colors = [...new Set(variants.map((p) => (p.kleur || "").trim()).filter(Boolean))].sort(byText);
    const sizes = [...new Set(variants.map((p) => (p.maat || "").trim()).filter(Boolean))].sort(compareSizes);
    return {
      key,
      db: first.db,
      collection: first.collection,
      refnr: first.refnr,
      title: productTitle(first),
      merk: first.merk,
      variants,
      colors,
      sizes,
      stock: variants.reduce((n, p) => n + quantity(p), 0),
      value: variants.reduce((n, p) => n + (p.value || 0), 0),
      empty: variants.filter((p) => status(p) === "empty").length,
      low: variants.filter((p) => status(p) === "low").length,
      duplicates: variants.filter((p) => p.duplicate).length,
      noPrice: variants.filter((p) => !p.has_price).length,
      oldStock: variants.some((p) => p.lang_in_stock),
      updated: Math.max(...variants.map(updatedAt)),
    };
  });
}

// The rows that are entered more than once in a model, per colour and size: [{ key, kleur, maat, stock, parts, otherNames }].
// `parts` splits them per name: only rows with the same name are really the same product (`mergeable`).
// Different names under one refnr mean a wrong refnr, which only a person can correct.
export function duplicateGroups(variants) {
  const groups = new Map();
  for (const variant of variants) {
    const key = variantKey(variant);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(variant);
  }
  return [...groups]
    .filter(([, rows]) => rows.length > 1)
    .map(([key, rows]) => {
      const names = new Map();
      for (const row of rows) {
        const name = text(row.modelnaam);
        if (!names.has(name)) names.set(name, []);
        names.get(name).push(row);
      }
      return {
        key,
        kleur: rows[0].kleur,
        maat: rows[0].maat,
        stock: rows.reduce((n, p) => n + quantity(p), 0),
        otherNames: names.size > 1,
        parts: [...names].map(([name, partRows]) => ({
          name,
          rows: partRows,
          stock: partRows.reduce((n, p) => n + quantity(p), 0),
          mergeable: partRows.length > 1 && !mergeProblem(partRows),
          problem: partRows.length > 1 ? mergeProblem(partRows) : null,
        })),
      };
    });
}

export function sortModels(models, sort) {
  return models.slice().sort((a, b) => {
    if (sort === "laag") return a.stock - b.stock || byText(a.title, b.title);
    if (sort === "waarde") return b.value - a.value || byText(a.title, b.title);
    if (sort === "recent") return b.updated - a.updated || byText(a.title, b.title);
    if (sort === "refnr") return byText(a.refnr, b.refnr) || byText(a.title, b.title);
    return byText(a.title, b.title) || byText(a.refnr, b.refnr);
  });
}

// The sizes in a list of products, in size order: [[maat, count], ...]
export function sizesIn(products) {
  const counts = new Map();
  products.forEach((p) => {
    const maat = (p.maat || "").trim();
    if (maat) counts.set(maat, (counts.get(maat) || 0) + 1);
  });
  return [...counts].sort((a, b) => compareSizes(a[0], b[0]));
}
