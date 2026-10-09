// Formatting, filtering and sorting for the dashboard (browser and server)
import { compareSizes, toNumberOrZero } from "./product.js";
import { colorFamily, familyForWord } from "./colors.js";

export const nf = new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 2 });
export const eur = new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" });
export const eur0 = new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export const DAY = 86400000;

export function productKey(product) {
  return `${product.db}:${product.collection}:${product._id}`;
}

export function quantity(product) {
  return toNumberOrZero(product.stock);
}

// "empty" (op), "low" (bijna op, only in inventories with a limit: product.low_below) or "ok"
export function status(product) {
  const n = quantity(product);
  if (n <= 0) return "empty";
  if (n < toNumberOrZero(product.low_below)) return "low";
  return "ok";
}

export function updatedAt(product) {
  const time = product.updated_at ? new Date(product.updated_at).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

// The title of a product: the model name, or the reference when there is none
export function productTitle(product) {
  return product.modelnaam || product.refnr || "Zonder naam";
}

// "Navy · M · dames", the variant in one line
export function variantLine(product) {
  return [product.kleur, product.maat ? product.maat.toUpperCase() : "", product.gender].filter(Boolean).join(" · ");
}

// `now` comes from the server, so the server and browser render the same text
export function relativeTime(time, now) {
  if (!time) return "";
  const diff = (now - time) / 1000;
  if (diff < 60) return "zonet";
  if (diff < 3600) return `${Math.floor(diff / 60)} min geleden`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} u geleden`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} d geleden`;
  const date = new Date(time);
  return date.toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date(now).getFullYear() ? undefined : "numeric",
  });
}

// Every word must be found in one of the fields. A colour family ("blauw", "blue") also finds
// the shades of that family ("navy", "royal blue").
export function matches(product, query) {
  if (!query) return true;
  const haystack = [product.refnr, product.modelnaam, product.merk, product.kleur, product.maat, product.gender, product.collection]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => {
      if (haystack.includes(word)) return true;
      const family = familyForWord(word);
      return Boolean(family) && colorFamily(product.kleur) === family;
    });
}

export const SORTS = [
  ["naam", "Model, kleur en maat"],
  ["refnr", "Refnr"],
  ["laag", "Laagste stock eerst"],
  ["waarde", "Hoogste waarde"],
  ["recent", "Laatst gewijzigd"],
];

const byText = (a, b) => String(a || "").localeCompare(String(b || ""), "nl", { numeric: true });

// Model, then colour, then size in size order (S before M before L)
function byModel(a, b) {
  return (
    byText(productTitle(a), productTitle(b)) ||
    byText(a.refnr, b.refnr) ||
    byText(a.kleur, b.kleur) ||
    compareSizes(a.maat, b.maat) ||
    byText(a.gender, b.gender)
  );
}

export function sortProducts(list, sort) {
  return list.slice().sort((a, b) => {
    if (sort === "laag") return quantity(a) - quantity(b) || byModel(a, b);
    if (sort === "waarde") return b.value - a.value || byModel(a, b);
    if (sort === "recent") return updatedAt(b) - updatedAt(a) || byModel(a, b);
    if (sort === "refnr") return byText(a.refnr, b.refnr) || byModel(a, b);
    return byModel(a, b);
  });
}

export function sum(list, get) {
  return list.reduce((total, item) => total + get(item), 0);
}

// The colours in a list of products, most used first: [[kleur, count], ...]
export function colorsIn(products) {
  const counts = new Map();
  products.forEach((p) => {
    const kleur = (p.kleur || "").trim();
    if (kleur) counts.set(kleur, (counts.get(kleur) || 0) + 1);
  });
  return [...counts].sort((a, b) => b[1] - a[1] || byText(a[0], b[0]));
}

// What caused a change in the history (see lib/history.js)
export const HISTORY_SOURCES = {
  aanvullen: "Aangevuld",
  afboeken: "Afgeboekt",
  aanpassen: "Aangepast",
  nieuw: "Nieuw product",
  verwijderd: "Verwijderd",
  import: "CSV-import",
};

// Date and time in Belgian time, the same on the server and in the browser
const dateTimeFormat = new Intl.DateTimeFormat("nl-BE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Brussels",
});
export const formatDateTime = (time) => dateTimeFormat.format(new Date(time));

// A "YYYY-MM-DD" date as "7 okt. 2026" (no time zone shift: it's a calendar date)
const dateFormat = new Intl.DateTimeFormat("nl-BE", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const formatDate = (isoDate) => dateFormat.format(new Date(`${isoDate}T00:00:00Z`));

// "hoodies_kids" -> "hoodies kids"
export const label = (name) => String(name || "").replace(/_/g, " ");
