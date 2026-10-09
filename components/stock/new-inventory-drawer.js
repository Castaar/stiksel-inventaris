import { useId, useState } from "react";
import { toast } from "react-hot-toast";

import { postJson } from "../../lib/client-api";
import { DrawerBody, DrawerFoot, DrawerHead } from "./drawer";

// A new inventory (a database) with its first category, e.g. "dtf" with "inktbussen"
export default function NewInventoryDrawer({ onClose, onCreated }) {
  const nameId = useId();
  const categoryId = useId();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await postJson("/api/collections", { action: "create-database", db: name, name: category });
      toast.success(`Inventaris "${result.db}" aangemaakt`);
      await onCreated(result.db);
    } catch (error) {
      toast.error(error.message);
      setBusy(false);
    }
  };

  return (
    <>
      <DrawerHead kicker="Nieuw" title="Inventaris toevoegen" onClose={onClose} />
      <DrawerBody as="form" id="inventory-form" onSubmit={create} autoComplete="off">
        <div className="field">
          <label htmlFor={nameId}>Naam van de inventaris</label>
          <input id={nameId} className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="bv. DTF-printer" data-autofocus />
        </div>
        <div className="field">
          <label htmlFor={categoryId}>Eerste categorie</label>
          <input id={categoryId} className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="bv. Inktbussen" />
        </div>
        <p className="hint">
          Namen worden kleine letters met _ (bv. dtf_printer). Meer categorieën en de &ldquo;bijna op&rdquo;-melding stel je daarna in
          bij Categorieën.
        </p>
      </DrawerBody>
      <DrawerFoot>
        <button type="button" className="btn" onClick={onClose}>
          Annuleren
        </button>
        <button type="submit" form="inventory-form" className="btn primary" disabled={busy || !name.trim() || !category.trim()}>
          {busy ? "Aanmaken…" : "Aanmaken"}
        </button>
      </DrawerFoot>
    </>
  );
}
