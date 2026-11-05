import { useState } from "react";
import { toast } from "react-hot-toast";

import { duplicateGroups } from "../../lib/models";
import { eur, label, nf, productKey } from "../../lib/stock-view";
import { mergeProducts } from "../../lib/stock-actions";
import { DrawerBody, DrawerHead } from "./drawer";
import VariantMatrix from "./variant-matrix";
import ColorDot from "./color-dot";
import { ModelTags, sizeRange } from "./model-card";

import styles from "../../styles/stock/_drawer.module.scss";

// A model with all its variants: the colour x size table, click a number to change that variant
export default function ModelDrawer({ model, onClose, onOpen, onAddVariant, onChanged }) {
  const [merging, setMerging] = useState(false);
  const groups = duplicateGroups(model.variants);
  const mergeable = groups.flatMap((group) => group.parts.filter((part) => part.mergeable));

  const merge = async (toMerge) => {
    const rows = toMerge.reduce((n, part) => n + part.rows.length, 0);
    if (!confirm(`${rows} rijen samenvoegen tot ${toMerge.length}? De aantallen worden opgeteld. Dit kan niet ongedaan gemaakt worden.`)) return;
    setMerging(true);
    try {
      for (const part of toMerge) await mergeProducts(part.rows);
      toast.success(toMerge.length > 1 ? `${toMerge.length} dubbels samengevoegd` : "Samengevoegd");
    } catch (error) {
      toast.error(`Samenvoegen mislukt: ${error.message}`);
    }
    await onChanged();
    setMerging(false);
  };

  return (
    <>
      <DrawerHead
        kicker={
          <span className="cap">
            {label(model.db)} · {label(model.collection)}
          </span>
        }
        title={<span className="cap">{model.title}</span>}
        onClose={onClose}
      />
      <DrawerBody>
        <div className={styles["variant-head"]}>
          {model.refnr && <span className="ref">{model.refnr}</span>}
          {model.merk && <span className="cap">{model.merk}</span>}
          <ModelTags model={model} />
        </div>

        <div className={styles["rowbox"]}>
          <div className={styles["rowbox-top"]}>
            <b className="display">{nf.format(model.stock)} stuks</b>
            <span className={styles["lbl"]}>
              {model.noPrice < model.variants.length ? `waarde ${eur.format(model.value)}` : <span className={styles["warn"]}>Geen AKP ingesteld</span>}
            </span>
          </div>
          <div className="hint">
            {model.colors.length} {model.colors.length === 1 ? "kleur" : "kleuren"}
            {model.sizes.length > 0 && `, maten ${sizeRange(model.sizes)}`}, {model.variants.length} varianten
          </div>
        </div>

        {groups.length > 0 && (
          <>
            <h3>Dubbel ingevoerd</h3>
            <div className={styles["dups"]}>
              {groups.map((group) => (
                <div key={group.key} className={styles["dup-row"]}>
                  <div className={styles["dup-top"]}>
                    <span className="cap">
                      <ColorDot kleur={group.kleur} /> {[group.kleur || "geen kleur", group.maat && group.maat.toUpperCase()].filter(Boolean).join(" · ")}
                    </span>
                    <span className={styles["lbl"]}>{nf.format(group.stock)} stuks</span>
                  </div>
                  {group.otherNames && (
                    <p className={styles["warn"]}>Verschillende modelnamen onder hetzelfde refnr: klik op een naam en pas het refnr aan.</p>
                  )}
                  {group.parts.map((part) => (
                    <div key={part.name} className={styles["dup-part"]}>
                      <button type="button" className="chip" onClick={() => onOpen(productKey(part.rows[0]))}>
                        {part.name || model.title} {part.rows.length > 1 ? `× ${part.rows.length} rijen` : ""} ({nf.format(part.stock)})
                      </button>
                      {part.mergeable && (
                        <button type="button" className={`btn small ${styles["push"]}`} disabled={merging} onClick={() => merge([part])}>
                          Samenvoegen
                        </button>
                      )}
                      {part.problem && <span className={styles["warn"]}>{part.problem}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {mergeable.length > 1 && (
              <p className="hint">
                <button type="button" className="btn small" disabled={merging} onClick={() => merge(mergeable)}>
                  Alles samenvoegen ({mergeable.length})
                </button>
              </p>
            )}
          </>
        )}

        <h3>Kleuren en maten</h3>
        <p className="hint">Klik op een aantal om af te boeken, aan te vullen of te bewerken.</p>
        <VariantMatrix variants={model.variants} onOpen={onOpen} />
        <p className="hint">
          <button type="button" className="btn small" onClick={onAddVariant}>
            + Kleuren of maten toevoegen
          </button>
        </p>
      </DrawerBody>
    </>
  );
}
