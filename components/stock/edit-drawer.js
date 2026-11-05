import { useId, useState } from "react";
import { toast } from "react-hot-toast";

import { PRODUCT_FIELDS } from "../../lib/product";
import { label, productTitle } from "../../lib/stock-view";
import { deleteProduct, updateProduct, updateRows } from "../../lib/stock-actions";
import { DrawerBody, DrawerFoot, DrawerHead } from "./drawer";
import ProductFields from "./product-fields";

export default function EditDrawer({ product, collections, suggestions, onClose, onSaved, onDeleted }) {
  const categoryId = useId();
  const [collection, setCollection] = useState(product.collection);
  const [isSaving, setIsSaving] = useState(false);
  const [values, setValues] = useState(() =>
    Object.fromEntries(PRODUCT_FIELDS.map(({ key }) => [key, product[key] ?? (key === "lang_in_stock" ? false : "")]))
  );

  const save = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Only what changed, so a quick -1 by someone else in the meantime isn't undone by an untouched stock field
      const changed = Object.fromEntries(
        Object.entries(values).filter(([key, value]) => String(value ?? "") !== String(product[key] ?? (key === "lang_in_stock" ? false : "")))
      );
      if (Object.keys(changed).length) await updateProduct(product, changed);
      if (collection !== product.collection) await updateRows([product], {}, collection);
      toast.success("De gegevens zijn bewaard");
      await onSaved(collection);
    } catch (error) {
      toast.error(`Bewaren mislukt: ${error.message}`);
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`"${productTitle(product)}" (${[product.kleur, product.maat].filter(Boolean).join(", ")}) verwijderen? Dit kan niet ongedaan gemaakt worden.`)) return;
    setIsSaving(true);
    try {
      await deleteProduct(product);
      toast.success("Product is verwijderd");
      await onDeleted();
    } catch (error) {
      toast.error(`Verwijderen mislukt: ${error.message}`);
      setIsSaving(false);
    }
  };

  return (
    <>
      <DrawerHead
        kicker={<span className="cap">Bewerken · {label(product.collection)}</span>}
        title={<span className="cap">{productTitle(product)}</span>}
        onClose={onClose}
      />
      <DrawerBody as="form" id="edit-form" onSubmit={save} autoComplete="off">
        <div className="field">
          <label htmlFor={categoryId}>Categorie</label>
          <select id={categoryId} className="input" value={collection} onChange={(e) => setCollection(e.target.value)}>
            {collections.map((name) => (
              <option key={name} value={name}>{label(name)}</option>
            ))}
          </select>
        </div>
        <ProductFields values={values} onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))} suggestions={suggestions} />
      </DrawerBody>
      <DrawerFoot
        left={
          <button type="button" className="btn danger" onClick={remove} disabled={isSaving}>
            Verwijderen
          </button>
        }
      >
        <button type="button" className="btn" onClick={onClose}>
          Annuleren
        </button>
        <button type="submit" form="edit-form" className="btn primary" disabled={isSaving}>
          {isSaving ? "Bewaren…" : "Wijzigingen opslaan"}
        </button>
      </DrawerFoot>
    </>
  );
}
