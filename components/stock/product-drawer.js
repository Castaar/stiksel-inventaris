import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { toNumber } from "../../lib/product";
import { eur, formatDate, label, nf, productTitle, quantity, relativeTime, sum, updatedAt, variantLine } from "../../lib/stock-view";
import { DrawerBody, DrawerHead } from "./drawer";
import HistoryList from "./history-list";
import VariantMatrix from "./variant-matrix";
import ColorDot from "./color-dot";
import { StatusTags } from "./product-card";

import styles from "../../styles/stock/_drawer.module.scss";

// Latest stock changes of this product; reloads after every change (updated_at)
function useProductHistory(product) {
  const [entries, setEntries] = useState(null);
  const { db, collection, _id: id, updated_at: version } = product;

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ db, collection, id });
    fetch(`/api/history?${params}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
      .then((data) => !cancelled && setEntries(data.entries))
      .catch(() => !cancelled && setEntries([]));
    return () => {
      cancelled = true;
    };
  }, [db, collection, id, version]);

  return entries;
}

// `variants` are all products with the same refnr in this database (this one included)
export default function ProductDrawer({ product, productKey, variants, now, onClose, onEdit, onChange, onOpen, busy }) {
  const [amount, setAmount] = useState("");
  const history = useProductHistory(product);

  const move = async (direction) => {
    const n = toNumber(amount);
    if (!(n > 0)) {
      toast.error("Vul eerst een aantal in");
      return;
    }
    if (await onChange(product, direction * n)) setAmount("");
  };

  return (
    <>
      <DrawerHead
        kicker={
          <span className="cap">
            {label(product.db)} · {label(product.collection)}
          </span>
        }
        title={<span className="cap">{productTitle(product)}</span>}
        onClose={onClose}
      />
      <DrawerBody>
        <div className={styles["variant-head"]}>
          <ColorDot kleur={product.kleur} big />
          <span className="cap">{variantLine(product) || "Geen kleur of maat"}</span>
          <span className="ref">{product.refnr}</span>
          <StatusTags product={product} />
        </div>

        <h3>Stock</h3>
        <div className={styles["rowbox"]}>
          <div className={styles["rowbox-top"]}>
            <b className="display">{nf.format(quantity(product))} stuks</b>
            <span className={styles["lbl"]}>
              {product.has_price ? (
                <>
                  {eur.format(product.akp)} per stuk, waarde {eur.format(product.value)}
                </>
              ) : (
                <span className={styles["warn"]}>Geen AKP ingesteld</span>
              )}
            </span>
          </div>
          <div className={styles["mut"]}>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              placeholder="Hoeveel stuks"
              aria-label="Aantal stuks"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") move(-1);
              }}
              data-autofocus
            />
          </div>
          <div className={styles["mut"]}>
            <button type="button" className="btn small" disabled={busy} onClick={() => move(-1)}>
              − Afboeken
            </button>
            <button type="button" className="btn small" disabled={busy} onClick={() => move(1)}>
              + Aanvullen
            </button>
            <button type="button" className={`btn small ${styles["push"]}`} onClick={onEdit}>
              Bewerken
            </button>
          </div>
        </div>

        {variants.length > 1 && (
          <>
            <h3>
              Alle kleuren en maten van {product.refnr ? <span className="ref">{product.refnr}</span> : "dit model"}{" "}
              <span className={styles["lbl"]}>
                {variants.length} varianten, {nf.format(sum(variants, quantity))} stuks
              </span>
            </h3>
            <VariantMatrix variants={variants} currentKey={productKey} onOpen={onOpen} />
          </>
        )}

        <h3>Gegevens</h3>
        <dl className={styles["facts"]}>
          <dt>Refnr</dt>
          <dd className="ref">{product.refnr || "-"}</dd>
          <dt>Model</dt>
          <dd className="cap">{product.modelnaam || "-"}</dd>
          <dt>Merk</dt>
          <dd className="cap">{product.merk || "-"}</dd>
          <dt>Kleur</dt>
          <dd className="cap">{product.kleur || "-"}</dd>
          <dt>Maat</dt>
          <dd>{product.maat ? product.maat.toUpperCase() : "-"}</dd>
          <dt>Gender</dt>
          <dd className="cap">{product.gender || "-"}</dd>
          <dt>AKP</dt>
          <dd>{product.has_price ? eur.format(product.akp) : "-"}</dd>
          <dt>Leverdatum</dt>
          <dd>{product.leverdatum ? formatDate(product.leverdatum) : "-"}</dd>
          <dt>Lang in stock</dt>
          <dd>{product.lang_in_stock ? "Ja" : "Nee"}</dd>
          <dt>Laatst gewijzigd</dt>
          <dd>{updatedAt(product) ? relativeTime(updatedAt(product), now) : "onbekend"}</dd>
        </dl>

        <h3>Historiek</h3>
        {history === null ? (
          <p className="hint">Laden…</p>
        ) : history.length ? (
          <>
            <HistoryList entries={history} compact />
            <p className="hint">
              <Link href={{ pathname: "/historiek", query: { zoek: [product.refnr, product.kleur, product.maat].filter(Boolean).join(" ") } }}>
                Volledige historiek
              </Link>
            </p>
          </>
        ) : (
          <p className="hint">Nog geen wijzigingen bijgehouden voor dit product.</p>
        )}
      </DrawerBody>
    </>
  );
}
