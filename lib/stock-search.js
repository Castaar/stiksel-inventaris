// Searches over the products of the dashboard (lib/inventory.js listAllProducts).
// Used by the assistant; pure functions, so they're easy to test and reuse.
import { toNumberOrZero } from "./product.js";
import { colorFamily, familyForWord } from "./colors.js";

const normalize = (text) =>
  String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const inStock = (product) => toNumberOrZero(product.stock) > 0;

const contains = (value, wanted) => !wanted || normalize(value).includes(normalize(wanted).trim());

// Products where a word in one of the fields starts with one of the terms ("polo" finds "polo shirt",
// not "napoleon"). A colour family ("blauw", "blue") also finds its shades ("navy").
export function searchProducts(
  products,
  { terms = [], db, collection, merk, kleur, maat, gender, onlyAvailable = true } = {}
) {
  const words = terms.map((t) => normalize(t).trim()).filter(Boolean);
  const patterns = words.map((word) => new RegExp(`(^|[^a-z0-9])${escape(word)}`));
  const families = words.map(familyForWord);
  const wantedFamily = kleur ? familyForWord(kleur) : null;

  return products.filter((product) => {
    if (db && product.db !== db) return false;
    if (!contains(product.collection, collection)) return false;
    if (!contains(product.merk, merk)) return false;
    if (maat && normalize(product.maat).trim() !== normalize(maat).trim()) return false;
    if (!contains(product.gender, gender)) return false;
    if (kleur && !contains(product.kleur, kleur) && !(wantedFamily && colorFamily(product.kleur) === wantedFamily)) return false;
    if (onlyAvailable && !inStock(product)) return false;
    if (!patterns.length) return true;
    const haystack = normalize([product.refnr, product.modelnaam, product.merk, product.kleur, product.gender, product.collection].join(" "));
    return patterns.some((pattern, i) => pattern.test(haystack) || (families[i] && colorFamily(product.kleur) === families[i]));
  });
}
