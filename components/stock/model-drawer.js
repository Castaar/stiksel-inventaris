import { eur, label, nf } from "../../lib/stock-view";
import { DrawerBody, DrawerHead } from "./drawer";
import VariantMatrix from "./variant-matrix";
import { ModelTags, sizeRange } from "./model-card";

import styles from "../../styles/stock/_drawer.module.scss";

// A model with all its variants: the colour x size table, click a number to change that variant
export default function ModelDrawer({ model, onClose, onOpen, onAddVariant }) {
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

        <h3>Kleuren en maten</h3>
        <p className="hint">Klik op een aantal om af te boeken, aan te vullen of te bewerken.</p>
        <VariantMatrix variants={model.variants} onOpen={onOpen} />
        <p className="hint">
          <button type="button" className="btn small" onClick={onAddVariant}>
            + Kleur of maat toevoegen
          </button>
        </p>
      </DrawerBody>
    </>
  );
}
