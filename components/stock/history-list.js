import Link from "next/link";

import { HISTORY_SOURCES, formatDateTime, label, nf } from "../../lib/stock-view";
import ColorDot from "./color-dot";

import styles from "../../styles/stock/_history.module.scss";

function productHref(entry) {
  return { pathname: "/", query: { tab: entry.db, cat: entry.collection, open: entry.product_id } };
}

const variant = (entry) => [entry.kleur, entry.maat ? entry.maat.toUpperCase() : ""].filter(Boolean).join(" · ");

// Stock changes, newest first. `compact` leaves out the product (inside the product drawer).
export default function HistoryList({ entries, compact = false }) {
  return (
    <ol className={`${styles["list"]} ${compact ? styles["compact"] : ""}`}>
      {entries.map((entry) => {
        const up = entry.delta > 0;
        const change = (
          <>
            <span className={`${styles["delta"]} ${up ? styles["up"] : styles["down"]}`}>
              {up ? "+" : "−"}
              {nf.format(Math.abs(entry.delta))} <small>st.</small>
            </span>
            <span className={styles["what"]}>
              {!compact && (
                <b className="cap">
                  <ColorDot kleur={entry.kleur} /> {entry.name} <span className="ref">{entry.refnr}</span>
                </b>
              )}
              <span className="cap">
                {!compact && `${[variant(entry), label(entry.db), label(entry.collection)].filter(Boolean).join(" · ")} · `}
                {HISTORY_SOURCES[entry.source] || entry.source} · {nf.format(entry.before)} → {nf.format(entry.after)}
              </span>
            </span>
            <time dateTime={new Date(entry.at).toISOString()}>{formatDateTime(entry.at)}</time>
          </>
        );
        return (
          <li key={entry._id}>
            {compact || entry.source === "verwijderd" ? (
              <div className={styles["row"]}>{change}</div>
            ) : (
              <Link href={productHref(entry)} className={styles["row"]}>
                {change}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
