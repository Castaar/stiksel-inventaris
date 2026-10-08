// The product fields and the rules around them (browser and server).
// A product is one variant of a model: refnr + kleur + maat (+ gender), with its stock and purchase price (akp).

// Stored in lower case, as the inventory always did
export const TEXT_FIELDS = ["refnr", "modelnaam", "merk", "kleur", "gender", "maat"];

// The edit and new forms, in this order. `list` fields suggest values that already exist.
export const PRODUCT_FIELDS = [
  { key: "refnr", label: "Refnr", type: "text", required: true, placeholder: "bv. jh001" },
  { key: "modelnaam", label: "Modelnaam", type: "text", list: true, placeholder: "bv. college hoodie" },
  { key: "merk", label: "Merk", type: "text", list: true, placeholder: "bv. just hoods" },
  { key: "kleur", label: "Kleur", type: "text", list: true, placeholder: "bv. navy" },
  { key: "gender", label: "Gender", type: "text", list: true, placeholder: "bv. unisex" },
  { key: "maat", label: "Maat", type: "text", list: true, placeholder: "bv. m" },
  { key: "stock", label: "Stock (stuks)", type: "number", placeholder: "Aantal stuks" },
  { key: "akp", label: "AKP (€ per stuk)", type: "number", placeholder: "Aankoopprijs" },
  { key: "leverdatum", label: "Leverdatum", type: "date" },
  { key: "lang_in_stock", label: "Ligt al lang in stock", type: "checkbox" },
];

// From this many pieces down a product counts as "bijna op"
export const LOW_STOCK_THRESHOLD = 5;

// Accepts numbers and strings with a comma or dot as decimal separator.
// Returns NaN for anything that isn't a finite number.
export function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.trim().replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

export function toNumberOrZero(value) {
  const n = toNumber(value);
  return Number.isNaN(n) ? 0 : n;
}

export const text = (value) => String(value ?? "").trim().toLowerCase();

// Stock value: pieces x purchase price
export function productValue(doc) {
  const value = Math.max(toNumberOrZero(doc.stock), 0) * toNumberOrZero(doc.akp);
  return Number.isFinite(value) ? value : 0;
}

export function hasPrice(doc) {
  return toNumberOrZero(doc.akp) > 0;
}

// Two rows with the same key in one category are the same product (a duplicate)
export function variantKey(doc) {
  return ["refnr", "kleur", "maat", "gender"].map((key) => text(doc[key])).join("|");
}

// Letter sizes in their natural order; "2xl" and "xxl" are the same
const LETTER_SIZES = ["xxxs", "xxs", "xs", "s", "m", "l", "xl", "xxl", "xxxl", "4xl", "5xl", "6xl"];
const SIZE_ALIASES = { "2xs": "xxs", "3xs": "xxxs", "2xl": "xxl", "3xl": "xxxl", small: "s", medium: "m", large: "l" };

// [group, rank, text]: numbers first (kids, shoes), then letter sizes, then anything else
function sizeRank(maat) {
  const size = text(maat).replace(/\s+/g, "");
  const letter = LETTER_SIZES.indexOf(SIZE_ALIASES[size] || size);
  if (letter >= 0) return [1, letter, size];
  const number = parseFloat(size.replace(",", "."));
  if (Number.isFinite(number)) return [0, number, size];
  return [2, 0, size];
}

export function compareSizes(a, b) {
  const [ga, ra, ta] = sizeRank(a);
  const [gb, rb, tb] = sizeRank(b);
  return ga - gb || ra - rb || ta.localeCompare(tb, "nl", { numeric: true });
}
