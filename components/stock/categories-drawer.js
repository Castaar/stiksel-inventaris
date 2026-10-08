import { useId, useState } from "react";
import { toast } from "react-hot-toast";

import { label } from "../../lib/stock-view";
import { manageCollection } from "../../lib/stock-actions";
import { DrawerBody, DrawerHead } from "./drawer";

import styles from "../../styles/stock/_drawer.module.scss";

export default function CategoriesDrawer({ db, collections, onClose, onChanged }) {
  const inputId = useId();
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (body, successMessage) => {
    setBusy(true);
    try {
      const result = await manageCollection(db, body);
      toast.success(successMessage(result));
      await onChanged();
      return true;
    } catch (e) {
      toast.error(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const create = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (await run({ action: "create", name: newName }, (r) => `Categorie "${r.name}" aangemaakt`)) setNewName("");
  };

  const rename = (name) => {
    const next = prompt(`Nieuwe naam voor "${name}":`, name);
    if (next && next !== name) run({ action: "rename", name, newName: next }, (r) => `Hernoemd naar "${r.name}"`);
  };

  const remove = (name) => {
    if (confirm(`Categorie "${name}" verwijderen? Dit kan alleen als ze leeg is.`)) {
      run({ action: "delete", name }, () => `Categorie "${name}" verwijderd`);
    }
  };

  return (
    <>
      <DrawerHead kicker="Beheer" title={<span className="cap">Categorieën {label(db)}</span>} onClose={onClose} />
      <DrawerBody>
        <form className="field" onSubmit={create}>
          <label htmlFor={inputId}>Nieuwe categorie</label>
          <div className={styles["mut"]} style={{ marginTop: 0 }}>
            <input
              id={inputId}
              className="input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="bv. Hoodies kids"
              data-autofocus
            />
            <button type="submit" className="btn primary" disabled={busy || !newName.trim()}>
              Aanmaken
            </button>
          </div>
        </form>
        <p className="hint">Namen worden kleine letters met _ (bv. hoodies_kids). Alleen lege categorieën kunnen weg.</p>
        <h3>{collections.length} categorieën</h3>
        {collections.map((name) => (
          <div key={name} className={styles["cat-row"]}>
            <span className="cap">{label(name)}</span>
            <button type="button" className="btn small" onClick={() => rename(name)} disabled={busy}>
              Hernoem
            </button>
            <button type="button" className="btn small danger" onClick={() => remove(name)} disabled={busy}>
              Verwijder
            </button>
          </div>
        ))}
      </DrawerBody>
    </>
  );
}
