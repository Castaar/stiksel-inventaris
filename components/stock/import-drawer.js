import { useId, useState } from "react";
import { toast } from "react-hot-toast";

import { label } from "../../lib/stock-view";
import { uploadImport } from "../../lib/stock-actions";
import { DrawerBody, DrawerFoot, DrawerHead } from "./drawer";

import styles from "../../styles/stock/_drawer.module.scss";

const plural = (n, one, more) => `${n} ${n === 1 ? one : more}`;

// CSV import: first a check that shows what will change, then the real import
export default function ImportDrawer({ data, initialDb, needsPassword, onClose, onImported }) {
  const dbId = useId();
  const categoryId = useId();
  const fileId = useId();
  const passwordId = useId();
  const databases = Object.keys(data);
  const [db, setDb] = useState(databases.includes(initialDb) ? initialDb : databases[0] || "");
  const [collection, setCollection] = useState("");
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const options = { db, collection, password };
  const reset = () => setPreview(null);

  const check = async (e) => {
    e.preventDefault();
    if (!file || !db) return;
    setBusy(true);
    try {
      setPreview(await uploadImport(file, { ...options, dryRun: true }));
    } catch (error) {
      toast.error(`Controle mislukt: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const run = async () => {
    setBusy(true);
    try {
      const result = await uploadImport(file, { ...options, dryRun: false });
      toast.success(`Import gelukt: ${result.insertsCount} nieuw, ${result.updatesCount} bijgewerkt, ${result.deletesCount} verwijderd`);
      await onImported(db);
    } catch (error) {
      toast.error(`Import mislukt: ${error.message}`);
      setBusy(false);
    }
  };

  return (
    <>
      <DrawerHead kicker="Importeren" title="Stock uit CSV" onClose={onClose} />
      <DrawerBody as="form" id="import-form" onSubmit={check}>
        <p className="hint">
          Kolommen: collectie, refnr, modelnaam, merk, kleur, gender, maat, stock, akp (komma of puntkomma). Een export uit
          deze app kan je aanpassen en terug importeren. Per categorie in het bestand worden producten bijgewerkt of toegevoegd,
          en verwijderd als ze niet meer in het bestand staan. Andere categorieën blijven zoals ze zijn.
        </p>
        <div className="field">
          <label htmlFor={dbId}>Database</label>
          <select
            id={dbId}
            className="input"
            value={db}
            onChange={(e) => {
              setDb(e.target.value);
              setCollection("");
              reset();
            }}
          >
            {databases.map((name) => (
              <option key={name} value={name}>{label(name)}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={categoryId}>Categorie voor rijen zonder kolom collectie</label>
          <select
            id={categoryId}
            className="input"
            value={collection}
            onChange={(e) => {
              setCollection(e.target.value);
              reset();
            }}
          >
            <option value="">Het bestand heeft een kolom collectie</option>
            {(data[db]?.collections || []).map((name) => (
              <option key={name} value={name}>{label(name)}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={fileId}>Bestand (.csv)</label>
          <input
            id={fileId}
            className="input"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              reset();
            }}
            data-autofocus
          />
        </div>
        {needsPassword && (
          <div className="field">
            <label htmlFor={passwordId}>Importwachtwoord</label>
            <input
              id={passwordId}
              className="input"
              type="password"
              autoComplete="off"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                reset();
              }}
            />
          </div>
        )}
        {preview && (
          <>
            <h3>Wat er gaat gebeuren</h3>
            <ul className={styles["preview"]}>
              {preview.collections.map((c) => (
                <li key={c.name}>
                  <b className="cap">{label(c.name)}</b>
                  {c.isNew && " (nieuwe categorie)"}: {c.inserts} nieuw, {c.updates} bijwerken, {c.deletes} verwijderen
                  {c.conflicts > 0 && `, ${plural(c.conflicts, "rij", "rijen")} overslaan (gewijzigd na de export)`}
                  {c.unchanged > 0 && `, ${c.unchanged} ongewijzigd`}
                </li>
              ))}
              {preview.skipped > 0 && <li>{plural(preview.skipped, "rij", "rijen")} van een andere database overslaan</li>}
            </ul>
            {preview.deletesCount > 0 && (
              <p className={styles["warn"]}>
                Let op: {plural(preview.deletesCount, "product wordt", "producten worden")} verwijderd omdat ze niet in het bestand staan.
              </p>
            )}
            {preview.errorCount > 0 && (
              <div className="error-message">
                <p>{plural(preview.errorCount, "rij heeft", "rijen hebben")} een fout. Pas het bestand aan en controleer opnieuw.</p>
                <ul>
                  {preview.errors.map((error) => (
                    <li key={error.line}>
                      Regel {error.line}: {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </DrawerBody>
      <DrawerFoot>
        <button type="button" className="btn" onClick={onClose}>
          Annuleren
        </button>
        {preview && !preview.errorCount ? (
          <button type="button" className="btn primary" onClick={run} disabled={busy}>
            {busy ? "Importeren…" : "Importeren"}
          </button>
        ) : (
          <button type="submit" form="import-form" className="btn primary" disabled={busy || !file || !db || (needsPassword && !password)}>
            {busy ? "Controleren…" : "Controleren"}
          </button>
        )}
      </DrawerFoot>
    </>
  );
}
