import Link from "next/link";

import {
  DAY,
  SORTS,
  colorsIn,
  eur,
  eur0,
  label,
  nf,
  productKey,
  productTitle,
  quantity,
  relativeTime,
  sortProducts,
  status,
  sum,
  updatedAt,
  variantLine,
} from "../../lib/stock-view";
import { ProductGrid } from "./product-card";
import ColorDot from "./color-dot";

import styles from "../../styles/stock/_dashboard.module.scss";

// Colours for the share of each database in the total value
const PART_COLORS = ["var(--accent)", "var(--petrol)", "var(--sky)", "var(--ochre)", "var(--line-strong)"];

function BlockHead({ title, meta, children }) {
  return (
    <div className={styles["block-head"]}>
      <h2>{title}</h2>
      {meta && <span className={styles["meta"]}>{meta}</span>}
      {children && <div className={styles["right"]}>{children}</div>}
    </div>
  );
}

export function SortSelect({ sort, onSort }) {
  return (
    <select className={styles["sort"]} value={sort} onChange={(e) => onSort(e.target.value)} aria-label="Sorteren">
      {SORTS.map(([key, title]) => (
        <option key={key} value={key}>{title}</option>
      ))}
    </select>
  );
}

// Latest changes, based on each product's updated_at
export function RecentList({ products, limit, now, onOpen }) {
  const list = products
    .filter((product) => updatedAt(product))
    .sort((a, b) => updatedAt(b) - updatedAt(a))
    .slice(0, limit);

  if (!list.length) {
    return (
      <div className="empty-state">
        <p>Nog geen wijzigingen. Elke aanpassing aan een product verschijnt hier.</p>
      </div>
    );
  }
  return (
    <div className={styles["log"]}>
      {list.map((product) => (
        <button key={productKey(product)} type="button" className={styles["log-row"]} onClick={() => onOpen(productKey(product))}>
          <span className={styles["log-qty"]}>
            {nf.format(quantity(product))} <small>st.</small>
          </span>
          <span className={styles["what"]}>
            <b className="cap">
              <ColorDot kleur={product.kleur} /> {productTitle(product)} <span className="ref">{product.refnr}</span>
            </b>
            <span className="cap">
              {variantLine(product)} · {label(product.db)} · {label(product.collection)}
            </span>
          </span>
          <time dateTime={new Date(updatedAt(product)).toISOString()}>{relativeTime(updatedAt(product), now)}</time>
        </button>
      ))}
    </div>
  );
}

export function Overview({ data, now, cardProps, onOpen, onShowNoPrice }) {
  const databases = Object.keys(data);
  const all = databases.flatMap((db) => data[db].products);
  const values = databases.map((db) => sum(data[db].products, (p) => p.value));
  const total = sum(values, (v) => v);
  const noPrice = all.filter((p) => !p.has_price).length;
  const empty = all.filter((p) => status(p) === "empty").length;
  const low = all.filter((p) => status(p) === "low").length;
  const duplicates = all.filter((p) => p.duplicate).length;
  // Empty first, then almost empty, then duplicates
  const attention = sortProducts(all.filter((p) => status(p) !== "ok" || p.duplicate), "laag");
  const changedThisWeek = all.filter((p) => now - updatedAt(p) < 7 * DAY).length;
  const pieces = sum(all, quantity);
  const collectionCount = sum(databases, (db) => data[db].collections.length);

  return (
    <>
      <div className={styles["hero"]}>
        <div className={styles["hero-main"]}>
          <div className={styles["hero-label"]}>Totale stockwaarde (stock × AKP)</div>
          <div className={styles["hero-value"]}>{eur0.format(total)}</div>
          {noPrice ? (
            <div className={styles["hero-note"]}>
              {noPrice} {noPrice === 1 ? "product heeft" : "producten hebben"} geen AKP en {noPrice === 1 ? "telt" : "tellen"} niet mee.{" "}
              <button type="button" className="linkbtn" onClick={onShowNoPrice}>Toon ze</button>
            </div>
          ) : (
            <div className={styles["hero-label"]}>Alle producten hebben een AKP.</div>
          )}
          {databases.length > 1 && (
            <div className={styles["bar-split"]} aria-hidden="true">
              {databases.map((db, i) => (
                <i key={db} style={{ width: `${total ? (values[i] / total) * 100 : 0}%`, background: PART_COLORS[i % PART_COLORS.length] }} />
              ))}
            </div>
          )}
        </div>
        <div className={styles["hero-split"]}>
          {databases.map((db, i) => (
            <Link key={db} href={{ pathname: "/", query: { tab: db } }} shallow scroll={false}>
              <span className={styles["hero-label"]}>
                {databases.length > 1 && <i className={styles["dot"]} style={{ background: PART_COLORS[i % PART_COLORS.length] }} />}
                <span className="cap">{label(db)}</span>
              </span>
              <span className={styles["v"]}>{eur.format(values[i])}</span>
              <span className={styles["s"]}>
                {data[db].products.length} producten, {nf.format(sum(data[db].products, quantity))} stuks in {data[db].collections.length} categorieën
              </span>
            </Link>
          ))}
          {!databases.length && <span className={styles["s"]}>Nog geen databases gevonden.</span>}
        </div>
      </div>

      <div className={styles["kpis"]}>
        <a href="#aandacht" className={`${styles["kpi"]} ${empty ? styles["kpi-alert"] : ""}`}>
          <div className={styles["n"]}>{empty}</div>
          <div className={styles["l"]}>Op (0 stuks)</div>
        </a>
        <a href="#aandacht" className={`${styles["kpi"]} ${low ? styles["kpi-warn"] : ""}`}>
          <div className={styles["n"]}>{low}</div>
          <div className={styles["l"]}>Bijna op (minder dan 5)</div>
        </a>
        <div className={styles["kpi"]}>
          <div className={styles["n"]}>{nf.format(pieces)}</div>
          <div className={styles["l"]}>Stuks in {all.length} producten, {collectionCount} categorieën</div>
        </div>
        <Link href={{ pathname: "/", query: { tab: "recent" } }} shallow scroll={false} className={styles["kpi"]}>
          <div className={styles["n"]}>{changedThisWeek}</div>
          <div className={styles["l"]}>Gewijzigd deze week</div>
        </Link>
        <button type="button" className={styles["kpi"]} onClick={onShowNoPrice}>
          <div className={styles["n"]}>{noPrice}</div>
          <div className={styles["l"]}>Zonder AKP</div>
        </button>
        {duplicates > 0 && (
          <a href="#aandacht" className={`${styles["kpi"]} ${styles["kpi-alert"]}`}>
            <div className={styles["n"]}>{duplicates}</div>
            <div className={styles["l"]}>Dubbele rijen</div>
          </a>
        )}
      </div>

      <section className={styles["block"]} id="aandacht">
        <BlockHead title="Aandacht nodig" meta="Op, bijna op of dubbel ingevoerd" />
        {attention.length ? (
          <ProductGrid products={attention} {...cardProps} />
        ) : (
          <div className="empty-state"><p>Alles is goed op voorraad.</p></div>
        )}
      </section>

      <section className={styles["block"]}>
        <BlockHead title="Laatst gewijzigd">
          <Link href={{ pathname: "/", query: { tab: "recent" } }} shallow className="btn small">Alles tonen</Link>
        </BlockHead>
        <RecentList products={all} limit={8} now={now} onOpen={onOpen} />
      </section>
    </>
  );
}

// The colours of the products shown, as a row of chips to filter on
function ColorFilter({ products, color, onColor }) {
  const colors = colorsIn(products);
  if (colors.length < 2 && !color) return null;
  return (
    <div className={`chips ${styles["color-row"]}`} role="group" aria-label="Filter op kleur">
      <button type="button" className="chip" aria-pressed={!color} onClick={() => onColor(null)}>
        Alle kleuren
      </button>
      {colors.map(([kleur, count]) => (
        <button key={kleur} type="button" className="chip" aria-pressed={color === kleur} onClick={() => onColor(color === kleur ? null : kleur)}>
          <ColorDot kleur={kleur} />
          {kleur} <small>{count}</small>
        </button>
      ))}
    </div>
  );
}

// One database: filter per category and colour, grouped per category when showing all
export function KindView({ db, part, category, onCategory, color, onColor, sort, onSort, cardProps, onAdd, onManage, onExport }) {
  const inCategory = category ? part.products.filter((p) => p.collection === category) : part.products;
  const shown = color ? inCategory.filter((p) => (p.kleur || "").trim() === color) : inCategory;
  const groups = category ? [category] : part.collections;

  return (
    <section className={styles["block"]}>
      <BlockHead
        title={label(db)}
        meta={`${shown.length} producten, ${nf.format(sum(shown, quantity))} stuks, ${eur.format(sum(shown, (p) => p.value))}`}
      >
        <SortSelect sort={sort} onSort={onSort} />
        <button type="button" className="btn small" onClick={onExport}>CSV</button>
        <button type="button" className="btn small" onClick={onManage}>Categorieën</button>
      </BlockHead>
      {part.collections.length > 1 && (
        <div className={`chips ${styles["chip-row"]}`} role="group" aria-label="Filter op categorie">
          <button type="button" className="chip" aria-pressed={!category} onClick={() => onCategory(null)}>
            Alle
          </button>
          {part.collections.map((name) => (
            <button key={name} type="button" className="chip" aria-pressed={category === name} onClick={() => onCategory(name)}>
              {label(name)}
            </button>
          ))}
        </div>
      )}
      <ColorFilter products={inCategory} color={color} onColor={onColor} />
      {groups.map((name) => {
        const products = sortProducts(shown.filter((p) => p.collection === name), sort);
        if (color && !products.length) return null;
        return (
          <div key={name}>
            <div className={styles["subhead"]}>
              <span className="cap">{label(name)}</span>{" "}
              <span>
                {products.length} producten, {nf.format(sum(products, quantity))} stuks, {eur.format(sum(products, (p) => p.value))}
              </span>
              <button type="button" className={`linkbtn ${styles["subhead-add"]}`} onClick={() => onAdd(db, name)}>
                + Product
              </button>
            </div>
            {products.length ? (
              <ProductGrid products={products} {...cardProps} />
            ) : (
              <div className="empty-state">
                <p>Nog geen producten in {label(name)}.</p>
                <button type="button" className="btn primary" onClick={() => onAdd(db, name)}>Product toevoegen</button>
              </div>
            )}
          </div>
        );
      })}
      {part.collections.length === 0 && (
        <div className="empty-state">
          <p>Nog geen categorieën.</p>
          <button type="button" className="btn primary" onClick={onManage}>Categorie aanmaken</button>
        </div>
      )}
    </section>
  );
}

export function ProductListSection({ title, meta, products, sort, onSort, cardProps, empty, actions }) {
  return (
    <section className={styles["block"]}>
      <BlockHead title={title} meta={meta}>
        {onSort && <SortSelect sort={sort} onSort={onSort} />}
        {actions}
      </BlockHead>
      {products.length ? <ProductGrid products={sortProducts(products, sort)} {...cardProps} /> : empty}
    </section>
  );
}

export function RecentView({ products, now, onOpen }) {
  return (
    <section className={styles["block"]}>
      <BlockHead title="Recent gewijzigd" meta="Laatste aanpassing per product, nieuwste eerst">
        <Link href="/historiek" className="btn small">Volledige historiek</Link>
      </BlockHead>
      <RecentList products={products} limit={200} now={now} onOpen={onOpen} />
    </section>
  );
}
