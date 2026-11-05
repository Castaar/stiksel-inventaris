import { useId, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { modelKey } from "../../lib/models";
import { label, nf } from "../../lib/stock-view";
import { addVariants } from "../../lib/stock-actions";
import { filledVariants, gridKey } from "../../lib/variant-grid";
import { DrawerBody, DrawerFoot, DrawerHead } from "./drawer";
import ProductFields, { suggestionsFor } from "./product-fields";
import VariantGrid from "./variant-grid";

// Today as YYYY-MM-DD in the browser's time zone (a new product usually just arrived)
function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const EMPTY = { refnr: "", modelnaam: "", merk: "", gender: "", akp: "", lang_in_stock: false };

const lower = (value) => String(value ?? "").trim().toLowerCase();

// The variants of a model (same refnr, or same name without one) in a database
function modelVariants(products, refnr, modelnaam) {
  const ref = lower(refnr);
  const name = lower(modelnaam);
  if (!ref && !name) return [];
  return products.filter((p) => (ref ? lower(p.refnr) === ref : !p.refnr && lower(p.modelnaam) === name));
}

const uniqueValues = (variants, field) => [...new Set(variants.map((p) => lower(p[field])).filter(Boolean))];

// One model in one go: pick the database and category, fill in the model, then the pieces per colour and size.
// `initialValues` prefills the form for an existing model: its colours and sizes are ready to fill in.
export default function NewDrawer({ data, initialDb, initialCollection, initialValues, onClose, onCreated }) {
  const categoryId = useId();
  const databases = Object.keys(data);
  const [db, setDb] = useState(databases.includes(initialDb) ? initialDb : databases[0] || "");
  const [collection, setCollection] = useState(initialCollection || "");
  const [values, setValues] = useState(() => ({ ...EMPTY, leverdatum: today(), ...initialValues }));
  const startVariants = () => {
    const variants = modelVariants(data[db]?.products || [], initialValues?.refnr, initialValues?.modelnaam);
    return variants.filter((p) => !initialCollection || p.collection === initialCollection);
  };
  const [colors, setColors] = useState(() => uniqueValues(startVariants(), "kleur"));
  const [sizes, setSizes] = useState(() => uniqueValues(startVariants(), "maat"));
  const [quantities, setQuantities] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const products = useMemo(() => data[db]?.products || [], [data, db]);
  const suggestions = useMemo(() => suggestionsFor(products), [products]);
  const collections = data[db]?.collections || [];

  // What's in stock now for each cell of the grid: filling in that cell adds to it
  const existing = useMemo(() => {
    const map = new Map();
    modelVariants(products, values.refnr, values.modelnaam)
      .filter((p) => p.collection === collection && lower(p.gender) === lower(values.gender))
      .forEach((p) => map.set(gridKey(lower(p.kleur), lower(p.maat)), Number(p.stock) || 0));
    return map;
  }, [products, values.refnr, values.modelnaam, values.gender, collection]);

  const variants = filledVariants(colors, sizes, quantities);
  const pieces = (variants || []).reduce((total, variant) => total + variant.stock, 0);

  const changeDb = (next) => {
    setDb(next);
    setCollection("");
  };

  const setField = (key, value) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      // A known refnr: take over the model, brand, gender and price, and its colours and sizes
      if (key === "refnr") {
        const known = modelVariants(products, value);
        if (known.length) {
          for (const field of ["modelnaam", "merk", "gender", "akp"]) {
            if (!prev[field] && known[0][field] !== null && known[0][field] !== undefined) next[field] = String(known[0][field]);
          }
          if (!collection) setCollection(known[0].collection);
          if (!colors.length) setColors(uniqueValues(known, "kleur"));
          if (!sizes.length) setSizes(uniqueValues(known, "maat"));
        }
      }
      return next;
    });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!collection) {
      toast.error("Kies een categorie");
      return;
    }
    if (!variants) {
      toast.error("Een aantal klopt niet: vul enkel getallen in");
      return;
    }
    if (!variants.length) {
      toast.error("Vul minstens één aantal in");
      return;
    }
    setIsSaving(true);
    try {
      const result = await addVariants(db, collection, values, variants);
      const parts = [result.created && `${result.created} nieuw`, result.added && `${result.added} aangevuld`].filter(Boolean);
      toast.success(`${nf.format(pieces)} stuks toegevoegd (${parts.join(", ")})`);
      // One variant opens that product, several open the model with its colours and sizes
      await onCreated(db, collection, variants.length === 1 ? result.ids[0] : null, modelKey({ db, collection, refnr: lower(values.refnr), modelnaam: lower(values.modelnaam) }));
    } catch (error) {
      toast.error(`Bewaren mislukt: ${error.message}`);
      setIsSaving(false);
    }
  };

  return (
    <>
      <DrawerHead kicker="Nieuw" title={initialValues ? "Kleuren en maten toevoegen" : "Product toevoegen"} onClose={onClose} />
      <DrawerBody as="form" id="new-form" onSubmit={save} autoComplete="off">
        {databases.length > 1 && (
          <div className="field">
            <label>Database</label>
            <div className="seg">
              {databases.map((name) => (
                <button key={name} type="button" aria-pressed={db === name} onClick={() => changeDb(name)}>
                  {label(name)}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="field">
          <label htmlFor={categoryId}>Categorie</label>
          <select id={categoryId} className="input" value={collection} onChange={(e) => setCollection(e.target.value)}>
            <option value="">Kies een categorie</option>
            {collections.map((name) => (
              <option key={name} value={name}>{label(name)}</option>
            ))}
          </select>
        </div>
        <ProductFields values={values} onChange={setField} suggestions={suggestions} skip={["kleur", "maat", "stock"]} />
        <VariantGrid
          colors={colors}
          sizes={sizes}
          quantities={quantities}
          existing={existing}
          suggestions={suggestions}
          onColors={setColors}
          onSizes={setSizes}
          onQuantity={(key, value) => setQuantities((prev) => ({ ...prev, [key]: value }))}
        />
      </DrawerBody>
      <DrawerFoot>
        <button type="button" className="btn" onClick={onClose}>
          Annuleren
        </button>
        <button type="submit" form="new-form" className="btn primary" disabled={isSaving || !collection}>
          {isSaving ? "Bewaren…" : pieces > 0 ? `${nf.format(pieces)} stuks toevoegen` : "Toevoegen"}
        </button>
      </DrawerFoot>
    </>
  );
}
