import { useId, useState } from "react";
import { toast } from "react-hot-toast";

import { modelKey } from "../../lib/models";
import { label, productTitle } from "../../lib/stock-view";
import { updateRows } from "../../lib/stock-actions";
import { DrawerBody, DrawerFoot, DrawerHead } from "./drawer";

const FIELDS = [
  { key: "refnr", label: "Refnr" },
  { key: "modelnaam", label: "Modelnaam", list: true },
  { key: "merk", label: "Merk", list: true },
  { key: "gender", label: "Gender", list: true },
  { key: "akp", label: "AKP (€ per stuk)" },
];

const shown = (value) => String(value ?? "");

// The value all rows share; rows that differ start empty and stay as they are unless something is typed
function commonValue(rows, key) {
  const values = new Set(rows.map((row) => shown(row[key])));
  return values.size === 1 ? { value: shown(rows[0][key]), differs: false } : { value: "", differs: true };
}

function Field({ field, value, differs, suggestions, onChange }) {
  const id = useId();
  const options = field.list ? suggestions?.[field.key] || [] : [];
  return (
    <div className="field">
      <label htmlFor={id}>{field.label}</label>
      <input
        id={id}
        className="input"
        inputMode={field.key === "akp" ? "decimal" : undefined}
        value={value}
        placeholder={differs ? "Verschilt per rij, blijft zo als je niets invult" : undefined}
        onChange={(e) => onChange(e.target.value)}
        list={options.length ? `${id}-list` : undefined}
      />
      {options.length > 0 && (
        <datalist id={`${id}-list`}>
          {options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      )}
    </div>
  );
}

// Edit several rows of a model at once: reference, name, brand, gender, price and category.
// Colour, size and stock stay per row.
export default function RowsEditDrawer({ rows, collections, suggestions, onClose, onSaved }) {
  const categoryId = useId();
  const [collection, setCollection] = useState(rows[0].collection);
  const [values, setValues] = useState(() => Object.fromEntries(FIELDS.map(({ key }) => [key, commonValue(rows, key).value])));
  const [isSaving, setIsSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    const changed = Object.fromEntries(
      Object.entries(values).filter(([key, value]) => {
        const common = commonValue(rows, key);
        // Empty stays as it is when the rows differ
        return common.differs ? value.trim() !== "" : value !== common.value;
      })
    );
    const moving = collection !== rows[0].collection;
    if (!Object.keys(changed).length && !moving) {
      onClose();
      return;
    }
    setIsSaving(true);
    try {
      await updateRows(rows, changed, moving ? collection : null);
      toast.success(rows.length > 1 ? `${rows.length} rijen aangepast` : "De gegevens zijn bewaard");
      const after = { ...rows[0], ...changed, collection };
      await onSaved(modelKey({ db: after.db, collection, refnr: shown(after.refnr).trim().toLowerCase(), modelnaam: shown(after.modelnaam).trim().toLowerCase(), _id: after._id }));
    } catch (error) {
      toast.error(`Bewaren mislukt: ${error.message}`);
      setIsSaving(false);
    }
  };

  return (
    <>
      <DrawerHead
        kicker={<span className="cap">Bewerken · {rows.length === 1 ? "1 rij" : `${rows.length} rijen`}</span>}
        title={<span className="cap">{productTitle(rows[0])}</span>}
        onClose={onClose}
      />
      <DrawerBody as="form" id="rows-edit-form" onSubmit={save} autoComplete="off">
        <div className="field">
          <label htmlFor={categoryId}>Categorie</label>
          <select id={categoryId} className="input" value={collection} onChange={(e) => setCollection(e.target.value)} data-autofocus>
            {collections.map((name) => (
              <option key={name} value={name}>{label(name)}</option>
            ))}
          </select>
        </div>
        {FIELDS.map((field) => (
          <Field
            key={field.key}
            field={field}
            value={values[field.key]}
            differs={commonValue(rows, field.key).differs}
            suggestions={suggestions}
            onChange={(value) => setValues((prev) => ({ ...prev, [field.key]: value }))}
          />
        ))}
        <p className="hint">Dit geldt voor {rows.length === 1 ? "deze rij" : `alle ${rows.length} rijen`}. Kleur, maat en aantal blijven per rij.</p>
      </DrawerBody>
      <DrawerFoot>
        <button type="button" className="btn" onClick={onClose}>
          Annuleren
        </button>
        <button type="submit" form="rows-edit-form" className="btn primary" disabled={isSaving}>
          {isSaving ? "Bewaren…" : "Wijzigingen opslaan"}
        </button>
      </DrawerFoot>
    </>
  );
}
