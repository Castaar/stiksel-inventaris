import { compareSizes } from "../../lib/product";
import { nf, productKey, quantity, status } from "../../lib/stock-view";
import ColorDot from "./color-dot";

import styles from "../../styles/stock/_drawer.module.scss";

// Every variant of one model (same refnr): a line per colour, a column per size, the stock in each cell
export default function VariantMatrix({ variants, currentKey, onOpen }) {
  // The gender only tells rows apart when the model has more than one
  const withGender = new Set(variants.map((p) => p.gender || "")).size > 1;
  const rowName = (p) => [p.kleur || "geen kleur", withGender ? p.gender : ""].filter(Boolean).join(" · ");
  const rows = [...new Set(variants.map(rowName))].sort((a, b) => a.localeCompare(b, "nl"));
  const sizes = [...new Set(variants.map((p) => p.maat || ""))].sort(compareSizes);
  const cell = new Map(variants.map((p) => [`${rowName(p)}|${p.maat || ""}`, p]));
  // From every variant, so a duplicate row (only one shows in its cell) still counts
  const totals = sizes.map((size) => variants.filter((p) => (p.maat || "") === size).reduce((n, p) => n + quantity(p), 0));

  return (
    <div className={styles["matrix-wrap"]}>
      <table className={styles["matrix"]}>
        <thead>
          <tr>
            <th scope="col">Kleur</th>
            {sizes.map((size) => (
              <th key={size} scope="col">{size ? size.toUpperCase() : "-"}</th>
            ))}
            {sizes.length > 1 && <th scope="col">Totaal</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const first = variants.find((p) => rowName(p) === row);
            return (
              <tr key={row}>
                <th scope="row" className="cap">
                  <ColorDot kleur={first.kleur} /> {row}
                </th>
                {sizes.map((size) => {
                  const product = cell.get(`${row}|${size}`);
                  if (!product) return <td key={size} className={styles["matrix-none"]}>·</td>;
                  const key = productKey(product);
                  return (
                    <td key={size}>
                      <button
                        type="button"
                        className={`${styles["matrix-cell"]} ${styles[`matrix-${status(product)}`] || ""}`}
                        aria-current={key === currentKey || undefined}
                        onClick={() => onOpen(key)}
                        aria-label={`${row} maat ${size || "-"}: ${nf.format(quantity(product))} stuks`}
                      >
                        {nf.format(quantity(product))}
                      </button>
                    </td>
                  );
                })}
                {sizes.length > 1 && (
                  <td className={styles["matrix-total"]}>
                    {nf.format(variants.filter((p) => rowName(p) === row).reduce((n, p) => n + quantity(p), 0))}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        {rows.length > 1 && (
          <tfoot>
            <tr>
              <th scope="row">Totaal</th>
              {totals.map((total, i) => (
                <td key={sizes[i]}>{nf.format(total)}</td>
              ))}
              {sizes.length > 1 && <td className={styles["matrix-total"]}>{nf.format(totals.reduce((a, b) => a + b, 0))}</td>}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
