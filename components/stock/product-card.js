import { eur, label, nf, productKey, productTitle, quantity, status } from "../../lib/stock-view";
import ColorDot from "./color-dot";

import styles from "../../styles/stock/_dashboard.module.scss";

export function StatusTags({ product }) {
  const state = status(product);
  return (
    <>
      {state === "empty" && <span className="tag empty">Op</span>}
      {state === "low" && <span className="tag low">Bijna op</span>}
      {product.duplicate && <span className="tag dup" title="Zelfde refnr, kleur, maat en gender staat meer dan eens in deze categorie">Dubbel</span>}
      {product.lang_in_stock && <span className="tag old">Lang in stock</span>}
    </>
  );
}

export default function ProductCard({ product, onOpen, onQuick, busy }) {
  const state = status(product);

  return (
    <article className={`${styles["card"]} ${styles[`card-${state}`] || ""} ${product.duplicate ? styles["card-dup"] : ""}`}>
      <button
        type="button"
        className={styles["card-open"]}
        onClick={() => onOpen(productKey(product))}
        aria-label={`${productTitle(product)} ${product.kleur || ""} ${product.maat || ""} openen`}
      />
      <div>
        <div className={styles["card-group"]}>
          <span className="cap">{label(product.collection)}</span>
          {product.merk && <span className="cap"> · {product.merk}</span>} <StatusTags product={product} />
        </div>
        <h3 className="cap">{productTitle(product)}</h3>
        {product.refnr && <div className={`${styles["card-ref"]} ref`}>{product.refnr}</div>}
      </div>
      <div className={styles["variant"]}>
        <span className={styles["variant-color"]}>
          <ColorDot kleur={product.kleur} />
          <span className="cap">{product.kleur || "geen kleur"}</span>
        </span>
        {product.maat && <span className={styles["size"]}>{product.maat.toUpperCase()}</span>}
        {product.gender && <span className={`${styles["gender"]} cap`}>{product.gender}</span>}
      </div>
      <div className={styles["qty"]}>
        <b>{nf.format(quantity(product))}</b>
        <span>stuks</span>
      </div>
      <div className={styles["card-foot"]}>
        {product.has_price ? (
          <span className={styles["val"]} title={`AKP ${eur.format(product.akp)} per stuk`}>{eur.format(product.value)}</span>
        ) : (
          <span className={`${styles["val"]} ${styles["val-np"]}`}>Geen AKP</span>
        )}
        <div className={styles["quick"]}>
          <button
            type="button"
            disabled={busy || quantity(product) < 1}
            onClick={() => onQuick(product, -1)}
            aria-label="1 stuk afboeken"
          >
            −
          </button>
          <button type="button" disabled={busy} onClick={() => onQuick(product, 1)} aria-label="1 stuk aanvullen">
            +
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, layout, ...cardProps }) {
  return (
    <div className={layout === "rijen" ? styles["rows"] : styles["grid"]}>
      {products.map((product) => (
        <ProductCard key={productKey(product)} product={product} {...cardProps} />
      ))}
    </div>
  );
}
