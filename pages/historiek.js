import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import { listDatabaseNames, toProps } from "../lib/inventory";
import { listHistory, topUsage } from "../lib/history";
import { HISTORY_SOURCES, label, nf } from "../lib/stock-view";

import AppHeader from "../components/layout/app-header";
import HistoryList from "../components/stock/history-list";
import ColorDot from "../components/stock/color-dot";

import styles from "../styles/stock/_history.module.scss";

const PAGE_SIZE = 200;
const TOP_DAYS = 30;

const text = (value) => (typeof value === "string" ? value.trim() : "");

export default function Historiek({ entries, top, filters, databases, hasMore, error }) {
  const router = useRouter();

  // Filters live in the URL, so a filtered view can be shared or reloaded
  const setFilter = (key, value) => {
    const query = { ...filters, [key]: value };
    delete query.voor;
    router.push({ pathname: "/historiek", query: Object.fromEntries(Object.entries(query).filter(([, v]) => v)) });
  };

  const olderQuery = { ...filters, voor: entries.length ? entries[entries.length - 1]._id : undefined };
  const filtered = Boolean(filters.zoek || filters.db || filters.bron || filters.voor);

  return (
    <>
      <Head>
        <title>Historiek - Stiksel Stock</title>
      </Head>
      <AppHeader menu={[{ label: "Terug naar overzicht", href: "/" }]} />
      <main className="wrap">
        <div className={styles["head"]}>
          <h1>Historiek.</h1>
          <p>Elke wijziging in de stock, nieuwste eerst.</p>
        </div>

        {error && <p className="error-message">De historiek kon niet worden geladen.</p>}

        {!filtered && top.length > 0 && (
          <section className={styles["block"]}>
            <h2>
              Meest verbruikt <span className={styles["meta"]}>laatste {TOP_DAYS} dagen, op basis van afboekingen</span>
            </h2>
            <div className={styles["top"]}>
              {top.map((item) => (
                <Link
                  key={`${item._id.db}:${item._id.collection}:${item._id.product_id}`}
                  href={{ pathname: "/historiek", query: { zoek: [item.refnr, item.kleur, item.maat].filter(Boolean).join(" ") } }}
                  className={styles["top-item"]}
                >
                  <b className="cap">{item.name}</b>
                  <span className="cap">
                    <ColorDot kleur={item.kleur} /> {[item.kleur, item.maat?.toUpperCase()].filter(Boolean).join(" · ")}
                  </span>
                  <span className="cap">
                    {label(item._id.db)} · {label(item._id.collection)}
                  </span>
                  <span className={styles["top-used"]}>
                    {nf.format(item.used)} <small>stuks</small>
                  </span>
                  <span>{item.times}× afgeboekt</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className={styles["block"]}>
          <h2>Alle wijzigingen</h2>
          <form
            className={styles["filters"]}
            onSubmit={(e) => {
              e.preventDefault();
              setFilter("zoek", text(new FormData(e.currentTarget).get("zoek")));
            }}
          >
            <input
              key={filters.zoek}
              type="search"
              name="zoek"
              className="input"
              defaultValue={filters.zoek}
              placeholder="Zoek op refnr, model, kleur of maat"
              aria-label="Zoeken"
            />
            {databases.length > 1 && (
              <select className="input" value={filters.db} onChange={(e) => setFilter("db", e.target.value)} aria-label="Database">
                <option value="">Alle databases</option>
                {databases.map((db) => (
                  <option key={db} value={db}>
                    {label(db)}
                  </option>
                ))}
              </select>
            )}
            <select className="input" value={filters.bron} onChange={(e) => setFilter("bron", e.target.value)} aria-label="Soort wijziging">
              <option value="">Alle wijzigingen</option>
              {Object.entries(HISTORY_SOURCES).map(([key, title]) => (
                <option key={key} value={key}>
                  {title}
                </option>
              ))}
            </select>
            <button type="submit" className="btn">Zoeken</button>
            {filtered && (
              <Link href="/historiek" className="linkbtn">
                Wissen
              </Link>
            )}
          </form>

          {entries.length ? (
            <HistoryList entries={entries} />
          ) : (
            <div className="empty-state">
              <p>
                {filtered
                  ? "Geen wijzigingen gevonden."
                  : "Nog geen wijzigingen. Vanaf nu wordt elke aanpassing aan de stock hier bijgehouden."}
              </p>
            </div>
          )}

          {hasMore && (
            <div className={styles["more"]}>
              <Link href={{ pathname: "/historiek", query: olderQuery }} className="btn">
                Oudere wijzigingen
              </Link>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export async function getServerSideProps({ query }) {
  const filters = {
    zoek: text(query.zoek),
    db: text(query.db),
    bron: HISTORY_SOURCES[query.bron] ? query.bron : "",
    voor: text(query.voor),
  };

  try {
    const databases = await listDatabaseNames();
    if (!databases.includes(filters.db)) filters.db = "";
    const [entries, top] = await Promise.all([
      listHistory({
        db: filters.db,
        search: filters.zoek,
        source: filters.bron,
        before: filters.voor,
        limit: PAGE_SIZE + 1,
      }),
      topUsage({ days: TOP_DAYS }),
    ]);
    return {
      props: toProps({
        entries: entries.slice(0, PAGE_SIZE),
        hasMore: entries.length > PAGE_SIZE,
        top,
        filters,
        databases,
        error: false,
      }),
    };
  } catch (e) {
    console.error("[Historiek] Error loading history:", e);
    return { props: { entries: [], top: [], filters, databases: [], hasMore: false, error: true } };
  }
}
