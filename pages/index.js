import { useCallback, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

import { loadInventories, toProps } from "../lib/inventory";
import { label, matches, nf, productKey, productTitle, sortProducts } from "../lib/stock-view";
import { groupModels, modelKey } from "../lib/models";
import { changeQuantity, downloadExport } from "../lib/stock-actions";

import AppHeader from "../components/layout/app-header";
import Drawer from "../components/stock/drawer";
import ProductDrawer from "../components/stock/product-drawer";
import ModelDrawer from "../components/stock/model-drawer";
import EditDrawer from "../components/stock/edit-drawer";
import NewDrawer from "../components/stock/new-drawer";
import CategoriesDrawer from "../components/stock/categories-drawer";
import NewInventoryDrawer from "../components/stock/new-inventory-drawer";
import ImportDrawer from "../components/stock/import-drawer";
import AiAnswer from "../components/stock/ai-answer";
import { suggestionsFor } from "../components/stock/product-fields";
import { KindView, Overview, ProductListSection, RecentView } from "../components/stock/views";

import styles from "../styles/stock/_dashboard.module.scss";

// Tiles or rows, remembered per browser in a cookie so the server renders the right one
const LAYOUT_COOKIE = "stiksel_stock_layout";
const LAYOUTS = ["tegels", "rijen"];

export default function Dashboard({ data, now, error, initialLayout, aiEnabled, importNeedsPassword, castaarUrl }) {
  const router = useRouter();
  const query = router.query;
  const databases = Object.keys(data);
  const tab = ["recent", "zonder-akp", ...databases].includes(query.tab) ? query.tab : "overzicht";
  const kindDb = databases.includes(tab) ? tab : null;
  const category = typeof query.cat === "string" ? query.cat : null;
  const color = typeof query.kleur === "string" ? query.kleur : null;
  const size = typeof query.maat === "string" ? query.maat : null;

  const [search, setSearch] = useState("");
  // Picking a tab ends the search
  const [searchTab, setSearchTab] = useState(tab);
  if (searchTab !== tab) {
    setSearchTab(tab);
    setSearch("");
  }
  const [sort, setSort] = useState("naam");
  const [layout, setLayout] = useState(initialLayout);
  // AI answer for one search text: { question, loading } | { question, answer, keys } | { question, error }
  const [ai, setAi] = useState(null);
  const changeLayout = (next) => {
    setLayout(next);
    document.cookie = `${LAYOUT_COOKIE}=${next}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  };
  const [busy, setBusy] = useState(false);
  // { type: "model", key } | { type: "product" | "edit", key, from? } | { type: "new", db, collection, values? }
  // | { type: "categories", db } | { type: "import", db } | { type: "inventory" }
  const [drawer, setDrawer] = useState(() => {
    if (query.add) return { type: "new", db: kindDb, collection: category };
    if (query.open && kindDb && category) return { type: "product", key: `${kindDb}:${category}:${query.open}` };
    return null;
  });

  const all = useMemo(() => databases.flatMap((db) => data[db].products), [data, databases]);
  const byKey = useMemo(() => new Map(all.map((p) => [productKey(p), p])), [all]);
  const models = useMemo(() => new Map(groupModels(all).map((m) => [m.key, m])), [all]);

  const setQuery = (next) =>
    router.replace({ pathname: "/", query: Object.fromEntries(Object.entries(next).filter(([, v]) => v)) }, undefined, {
      shallow: true,
      scroll: false,
    });

  // Fetch fresh data from the server (getServerSideProps) and keep the current view
  const refresh = useCallback(() => router.replace(router.asPath, undefined, { scroll: false }), [router]);

  const close = useCallback(() => setDrawer(null), []);
  const open = useCallback((key) => setDrawer({ type: "product", key }), []);
  const openModel = useCallback((key) => setDrawer({ type: "model", key }), []);

  const onQuantity = async (product, delta) => {
    setBusy(true);
    try {
      await changeQuantity(product, delta);
      await refresh();
      const variant = [product.kleur, product.maat?.toUpperCase()].filter(Boolean).join(" ");
      toast.success(`${delta < 0 ? "Afgeboekt" : "Aangevuld"}: ${nf.format(Math.abs(delta))} × ${productTitle(product)} ${variant}`);
      return true;
    } catch (e) {
      toast.error(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = async (db, collection) => {
    const id = toast.loading("Exporteren…");
    try {
      await downloadExport(db, collection);
      toast.success("Export gelukt", { id });
    } catch (e) {
      toast.error(`Export mislukt: ${e.message}`, { id });
    }
  };

  const askAi = async (question) => {
    question = question.trim();
    if (!aiEnabled || !question || (ai?.question === question && ai.loading)) return;
    setAi({ question, loading: true });
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Er ging iets mis");
      setAi({ question, answer: body.answer, keys: body.products || [] });
    } catch (e) {
      setAi({ question, error: e.message || "Er ging iets mis" });
    }
  };

  const addFor = (db, collection) => setDrawer({ type: "new", db, collection });

  const cardProps = { onOpen: open, onOpenModel: openModel, onQuick: onQuantity, busy, layout };
  const q = search.trim();

  let content;
  if (q) {
    const hits = all.filter((p) => matches(p, q));
    const aiForQuery = aiEnabled && ai?.question === q ? ai : null;
    content = (
      <>
        {aiEnabled && <AiAnswer question={q} ai={aiForQuery} onAsk={() => askAi(q)} byKey={byKey} cardProps={cardProps} />}
        {/* A question rarely matches product names: hide the empty name search once the AI answers */}
        {(hits.length > 0 || !aiForQuery) && (
          <ProductListSection
            title="Zoekresultaten"
            meta={`${hits.length} voor “${q}”`}
            products={hits}
            sort={sort}
            onSort={setSort}
            cardProps={cardProps}
            empty={
              <div className="empty-state">
                <p>Niets gevonden voor “{q}”.</p>
                <button type="button" className="btn" onClick={() => addFor(kindDb, category)}>Product toevoegen</button>
              </div>
            }
          />
        )}
      </>
    );
  } else if (kindDb) {
    content = (
      <KindView
        db={kindDb}
        part={data[kindDb]}
        category={data[kindDb].collections.includes(category) ? category : null}
        onCategory={(cat) => setQuery({ tab: kindDb, cat })}
        color={color}
        onColor={(kleur) => setQuery({ tab: kindDb, cat: category, kleur })}
        size={size}
        onSize={(maat) => setQuery({ tab: kindDb, cat: category, kleur: color, maat })}
        sort={sort}
        onSort={setSort}
        cardProps={cardProps}
        onAdd={addFor}
        onManage={() => setDrawer({ type: "categories", db: kindDb })}
        onExport={() => exportCsv(kindDb, data[kindDb].collections.includes(category) ? category : null)}
      />
    );
  } else if (tab === "recent") {
    content = <RecentView products={all} now={now} onOpen={open} />;
  } else if (tab === "zonder-akp") {
    const list = all.filter((p) => !p.has_price);
    content = (
      <ProductListSection
        title="Zonder AKP"
        meta={`${list.length} producten tellen niet mee in de stockwaarde`}
        products={sortProducts(list, "naam")}
        sort={sort}
        onSort={setSort}
        cardProps={cardProps}
        empty={<div className="empty-state"><p>Alle producten hebben een AKP.</p></div>}
      />
    );
  } else {
    content = <Overview data={data} now={now} cardProps={cardProps} onOpen={open} onShowNoPrice={() => setQuery({ tab: "zonder-akp" })} />;
  }

  // The drawer's product comes from the latest data, so it updates after every change
  const drawerProduct = drawer?.key ? byKey.get(drawer.key) : null;
  const drawerModel = drawer?.type === "model" ? models.get(drawer.key) : null;
  let drawerContent = null;
  if (drawerModel) {
    const first = drawerModel.variants[0];
    drawerContent = (
      <ModelDrawer
        key={drawer.key}
        model={drawerModel}
        onClose={close}
        onOpen={(key) => setDrawer({ type: "product", key, from: drawer.key })}
        onAddVariant={() =>
          setDrawer({
            type: "new",
            db: first.db,
            collection: first.collection,
            values: { refnr: first.refnr || "", modelnaam: first.modelnaam || "", merk: first.merk || "", gender: first.gender || "", akp: first.akp ?? "" },
          })
        }
      />
    );
  } else if (drawer?.type === "product" && drawerProduct) {
    const variants = drawerProduct.refnr
      ? data[drawerProduct.db].products.filter((p) => p.refnr === drawerProduct.refnr)
      : [drawerProduct];
    drawerContent = (
      <ProductDrawer
        key={drawer.key}
        product={drawerProduct}
        productKey={drawer.key}
        variants={variants}
        now={now}
        busy={busy}
        onClose={close}
        onChange={onQuantity}
        onOpen={open}
        onBack={drawer.from ? () => openModel(drawer.from) : models.get(modelKey(drawerProduct))?.variants.length > 1 ? () => openModel(modelKey(drawerProduct)) : undefined}
        onEdit={() => setDrawer({ type: "edit", key: drawer.key, from: drawer.from })}
      />
    );
  } else if (drawer?.type === "edit" && drawerProduct) {
    drawerContent = (
      <EditDrawer
        key={`${drawer.key}:${drawerProduct.updated_at}`}
        product={drawerProduct}
        suggestions={suggestionsFor(data[drawerProduct.db].products)}
        onClose={() => setDrawer({ type: "product", key: drawer.key, from: drawer.from })}
        onSaved={async () => {
          await refresh();
          setDrawer({ type: "product", key: drawer.key, from: drawer.from });
        }}
        onDeleted={async () => {
          setDrawer(null);
          await refresh();
        }}
      />
    );
  } else if (drawer?.type === "new" && databases.length) {
    const db = databases.includes(drawer.db) ? drawer.db : databases[0];
    drawerContent = (
      <NewDrawer
        data={data}
        initialDb={db}
        initialCollection={data[db].collections.includes(drawer.collection) ? drawer.collection : ""}
        initialValues={drawer.values}
        onClose={close}
        onCreated={async (createdDb, collection, id) => {
          await refresh();
          setDrawer(id ? { type: "product", key: `${createdDb}:${collection}:${id}` } : null);
        }}
      />
    );
  } else if (drawer?.type === "categories") {
    drawerContent = (
      <CategoriesDrawer
        db={drawer.db}
        collections={data[drawer.db]?.collections || []}
        lowStockBelow={data[drawer.db]?.low_stock_below || 0}
        onClose={close}
        onChanged={refresh}
      />
    );
  } else if (drawer?.type === "inventory") {
    drawerContent = (
      <NewInventoryDrawer
        onClose={close}
        onCreated={async (db) => {
          setDrawer(null);
          await router.push({ pathname: "/", query: { tab: db } });
        }}
      />
    );
  } else if (drawer?.type === "import" && databases.length) {
    drawerContent = (
      <ImportDrawer
        data={data}
        initialDb={drawer.db}
        needsPassword={importNeedsPassword}
        onClose={close}
        onImported={async () => {
          setDrawer(null);
          await refresh();
        }}
      />
    );
  }

  const productCount = all.length;
  const collectionCount = databases.reduce((n, db) => n + data[db].collections.length, 0);

  return (
    <>
      <Head>
        <title>{kindDb ? `${label(kindDb)} - Stiksel Stock` : "Stiksel Stock"}</title>
      </Head>
      <AppHeader
        tab={tab}
        databases={databases}
        search={search}
        onSearch={setSearch}
        onSearchSubmit={aiEnabled ? askAi : undefined}
        layout={layout}
        onLayout={changeLayout}
        castaarUrl={castaarUrl}
        onAdd={() => addFor(kindDb, kindDb ? category : null)}
        menu={[
          { label: "Exporteren naar CSV (alles)", onClick: () => exportCsv() },
          { label: "Importeren uit CSV", onClick: () => setDrawer({ type: "import", db: kindDb }) },
          ...databases.map((db) => ({ label: `Categorieën ${label(db)}`, onClick: () => setDrawer({ type: "categories", db }) })),
          { label: "Nieuwe inventaris", onClick: () => setDrawer({ type: "inventory" }) },
          { label: "Historiek", href: "/historiek" },
        ]}
      />
      <main className="wrap">
        {error && (
          <div className="error-message">
            De stock kon niet geladen worden.{" "}
            <button type="button" className="linkbtn" onClick={refresh}>Opnieuw laden</button>
          </div>
        )}
        {content}
        <footer className={styles["footer"]}>
          <span>
            {productCount} producten · {collectionCount} categorieën
          </span>
          <span>
            <button type="button" className="linkbtn" onClick={() => setDrawer({ type: "import", db: kindDb })}>CSV importeren</button>
            {" · "}
            <button type="button" className="linkbtn" onClick={() => exportCsv(kindDb)}>CSV exporteren</button>
            {" · "}
            <Link href="/historiek">Historiek</Link>
          </span>
        </footer>
      </main>
      <Drawer open={Boolean(drawerContent)} onClose={close} contentKey={drawer ? `${drawer.type}:${drawer.key}` : ""}>
        {drawerContent}
      </Drawer>
    </>
  );
}

export async function getServerSideProps({ req }) {
  const initialLayout = LAYOUTS.includes(req.cookies[LAYOUT_COOKIE]) ? req.cookies[LAYOUT_COOKIE] : "tegels";
  const flags = {
    aiEnabled: Boolean(process.env.GEMINI_API_KEY),
    importNeedsPassword: Boolean(process.env.IMPORT_PASSWORD),
    // The Castaar inventory, one click away in the header
    castaarUrl: process.env.CASTAAR_URL || null,
  };
  try {
    const data = await loadInventories();
    return { props: { data: toProps(data), now: Date.now(), error: false, initialLayout, ...flags } };
  } catch (e) {
    console.error("[Dashboard] Error loading stock:", e);
    return { props: { data: {}, now: Date.now(), error: true, initialLayout, ...flags } };
  }
}
