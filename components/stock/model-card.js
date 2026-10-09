import { eur, label, nf, productKey } from "../../lib/stock-view";
import ProductCard from "./product-card";
import ColorDot from "./color-dot";

import styles from "../../styles/stock/_dashboard.module.scss";

const MAX_DOTS = 10;

export function ModelTags({ model }) {
  return (
    <>
      {model.empty > 0 && <span className="tag empty">{model.empty} op</span>}
      {model.low > 0 && <span className="tag low">{model.low} bijna op</span>}
      {model.duplicates > 0 && <span className="tag dup">Dubbel</span>}
      {model.oldStock && <span className="tag old">Lang in stock</span>}
    </>
  );
}

// "XS – XXL" for a run of sizes, all of them when there are only a few
export function sizeRange(sizes) {
  const upper = sizes.map((s) => s.toUpperCase());
  if (upper.length <= 4) return upper.join(" · ");
  return `${upper[0]} – ${upper[upper.length - 1]}`;
}

// One card for a model with all its colours and sizes; the drawer shows the colour x size table
export function ModelCard({ model, onOpenModel }) {
  const state = model.stock <= 0 ? "empty" : model.empty || model.low ? "low" : "ok";
  const extraColors = model.colors.length - MAX_DOTS;

  return (
    <article className={`${styles["card"]} ${styles[`card-${state}`] || ""} ${model.duplicates ? styles["card-dup"] : ""}`}>
      <button
        type="button"
        className={styles["card-open"]}
        onClick={() => onOpenModel(model.key)}
        aria-label={`${model.title} openen: alle kleuren en maten`}
      />
      <div>
        <div className={styles["card-group"]}>
          <span className="cap">{label(model.collection)}</span>
          {model.merk && <span className="cap"> · {model.merk}</span>} <ModelTags model={model} />
        </div>
        <h3 className="cap">{model.title}</h3>
        {model.refnr && <div className={`${styles["card-ref"]} ref`}>{model.refnr}</div>}
      </div>
      <div className={styles["variant"]}>
        {model.colors.length > 0 && (
          <span className={styles["dots"]} title={model.colors.join(", ")}>
            {model.colors.slice(0, MAX_DOTS).map((kleur) => (
              <ColorDot key={kleur} kleur={kleur} />
            ))}
            {extraColors > 0 && <small>+{extraColors}</small>}
          </span>
        )}
        {model.sizes.length > 0 && <span className={styles["size"]}>{sizeRange(model.sizes)}</span>}
        <span className={styles["gender"]}>
          {model.colors.length > 1 && `${model.colors.length} kleuren`}
          {model.colors.length > 1 && model.sizes.length > 1 && ", "}
          {model.sizes.length > 1 && `${model.sizes.length} maten`}
        </span>
      </div>
      <div className={styles["qty"]}>
        <b>{nf.format(model.stock)}</b>
        <span>stuks</span>
      </div>
      <div className={styles["card-foot"]}>
        {model.noPrice < model.variants.length ? (
          <span className={styles["val"]}>{eur.format(model.value)}</span>
        ) : (
          <span className={`${styles["val"]} ${styles["val-np"]}`}>Geen AKP</span>
        )}
        <span className={styles["val-np"]}>{model.variants.length} varianten</span>
      </div>
    </article>
  );
}

// Models with one variant (thread, a cap in one size) stay a normal product card with + and −
export function ModelGrid({ models, layout, onOpenModel, ...cardProps }) {
  return (
    <div className={layout === "rijen" ? styles["rows"] : styles["grid"]}>
      {models.map((model) =>
        model.variants.length === 1 ? (
          <ProductCard key={productKey(model.variants[0])} product={model.variants[0]} {...cardProps} />
        ) : (
          <ModelCard key={model.key} model={model} onOpenModel={onOpenModel} />
        )
      )}
    </div>
  );
}
