import { useId, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { label } from "../../lib/stock-view";
import { addProduct } from "../../lib/stock-actions";
import { DrawerBody, DrawerFoot, DrawerHead } from "./drawer";
import ProductFields, { suggestionsFor } from "./product-fields";

// Today as YYYY-MM-DD in the browser's time zone (a new product usually just arrived)
function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const EMPTY = { refnr: "", modelnaam: "", merk: "", kleur: "", gender: "", maat: "", stock: "", akp: "", lang_in_stock: false };

// "S, M, L" -> ["S", "M", "L"]; one size (or none) -> [size]
const sizesOf = (maat) => {
  const sizes = String(maat || "").split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  return sizes.length ? sizes : [""];
};

// New product: pick the database and category, then the fields. Several sizes at once with "S, M, L".
// `initialValues` prefills the form, e.g. a new colour or size of an existing model
export default function NewDrawer({ data, initialDb, initialCollection, initialValues, onClose, onCreated }) {
  const categoryId = useId();
  const databases = Object.keys(data);
  const [db, setDb] = useState(databases.includes(initialDb) ? initialDb : databases[0] || "");
  const [collection, setCollection] = useState(initialCollection || "");
  const [values, setValues] = useState(() => ({ ...EMPTY, leverdatum: today(), ...initialValues }));
  const [isSaving, setIsSaving] = useState(false);

  const products = useMemo(() => data[db]?.products || [], [data, db]);
  const suggestions = useMemo(() => suggestionsFor(products), [products]);
  const collections = data[db]?.collections || [];
  const sizes = sizesOf(values.maat);

  const changeDb = (next) => {
    setDb(next);
    setCollection("");
  };

  const setField = (key, value) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      // A known refnr: take over the model, brand, gender and price of that model
      if (key === "refnr") {
        const known = products.find((p) => p.refnr && p.refnr === value.trim().toLowerCase());
        if (known) {
          for (const field of ["modelnaam", "merk", "gender", "akp"]) {
            if (!prev[field] && known[field] !== null && known[field] !== undefined) next[field] = String(known[field]);
          }
          if (!collection) setCollection(known.collection);
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
    setIsSaving(true);
    let lastId = null;
    let created = 0;
    try {
      for (const maat of sizes) {
        const result = await addProduct(db, collection, { ...values, maat });
        lastId = result.productId;
        created++;
      }
      toast.success(created > 1 ? `${created} maten toegevoegd` : "Product is toegevoegd");
      await onCreated(db, collection, created === 1 ? lastId : null);
    } catch (error) {
      toast.error(`${created ? `${created} toegevoegd, daarna mislukt` : "Bewaren mislukt"}: ${error.message}`);
      setIsSaving(false);
      if (created) await onCreated(db, collection, null);
    }
  };

  return (
    <>
      <DrawerHead kicker="Nieuw" title="Product toevoegen" onClose={onClose} />
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
        <ProductFields values={values} onChange={setField} suggestions={suggestions} />
        <p className="hint">
          Meerdere maten tegelijk? Typ ze met komma&apos;s (bv. S, M, L, XL): elke maat krijgt dit aantal stuks.
          {sizes.length > 1 && <b> Er worden {sizes.length} producten aangemaakt.</b>}
        </p>
      </DrawerBody>
      <DrawerFoot>
        <button type="button" className="btn" onClick={onClose}>
          Annuleren
        </button>
        <button type="submit" form="new-form" className="btn primary" disabled={isSaving || !collection}>
          {isSaving ? "Bewaren…" : sizes.length > 1 ? `${sizes.length} maten toevoegen` : "Toevoegen"}
        </button>
      </DrawerFoot>
    </>
  );
}
