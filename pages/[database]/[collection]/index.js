import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import clientPromise from "../../../lib/mongodb";
import styles from "../../../styles/modules/_document.module.scss";
import Link from "next/link";

const EMPTY_FORM = {
  refnr: "",
  modelnaam: "",
  kleur: "",
  gender: "",
  maat: "",
  stock: "",
  akp: "",
};

const LOW_STOCK_THRESHOLD = 5;

function slugFor(doc) {
  const colorInitials = (doc.kleur ?? "").trim().split(/\s+/).filter((w) => /^[a-zA-Z]/.test(w)).map((w) => w.charAt(0)).join("");
  return `${doc.refnr}-${colorInitials}`;
}

function toCSV(documents) {
  const headers = ["refnr", "modelnaam", "kleur", "gender", "maat", "stock", "akp"];
  const rows = documents.map((doc) => headers.map((h) => doc[h] ?? "").join(","));
  return [headers.join(","), ...rows].join("\n");
}

export default function CollectionPage({ database, collection, documents: initialDocuments = [], duplicateIds = [] }) {
  const dupSet = new Set(duplicateIds);
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(1);
  const [adjustingId, setAdjustingId] = useState(null);
  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => -d);
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  const visibleDocuments = documents
    .filter((doc) => {
      if (!search.trim()) return true;
      const needle = search.trim().toLowerCase();
      return [doc.refnr, doc.modelnaam, doc.kleur].some((v) => (v ?? "").toString().toLowerCase().includes(needle));
    })
    .sort((a, b) => {
      if (!sortKey) return 0;
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return 0;
    });

  async function handleStockAdjust(doc, delta) {
    const newStock = Number(doc.stock ?? 0) + delta;
    if (newStock < 0) return;
    setAdjustingId(doc._id);
    try {
      const res = await fetch(`/api/${database}/${collection}/${encodeURIComponent(slugFor(doc))}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
      if (!res.ok) throw new Error();
      setDocuments((prev) => prev.map((d) => (d._id === doc._id ? { ...d, stock: newStock } : d)));
    } catch {
      setImportMsg("Stock aanpassen mislukt");
    } finally {
      setAdjustingId(null);
    }
  }

  function handleExport() {
    const csv = toCSV(documents);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${collection}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/${database}/${collection}/import`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok && res.status !== 207) throw new Error(data.error ?? "Import mislukt");
      setImportMsg(`${data.inserted} rijen toegevoegd${data.warning ? " (" + data.warning + ")" : ""}`);
      router.replace(router.asPath);
    } catch (e) {
      setImportMsg(e.message);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/${database}/${collection}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Toevoegen mislukt");
      setAdding(false);
      setForm(EMPTY_FORM);
      router.replace(router.asPath);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setAdding(false);
    setForm(EMPTY_FORM);
    setError(null);
  }

  return (
    <>
      <Head>
        <title>Stiksel - {collection}</title>
      </Head>
      <main className="main">
        <div className="main-title">
          <h1>{collection}</h1>
          <button onClick={() => setAdding(true)}>Nieuw toevoegen</button>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}>
            {importing ? "Importeren..." : "CSV importeren"}
          </button>
          <button onClick={handleExport}>CSV exporteren</button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleImport}
          />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <input
            type="text"
            placeholder="Zoeken op refnr, modelnaam of kleur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {importMsg && <p style={{ marginBottom: "1rem" }}>{importMsg}</p>}

        {adding && (
          <form className="detail" onSubmit={handleSubmit}>
            <div>
              {Object.entries(EMPTY_FORM).map(([key]) => (
                <div key={key} className="detail-row">
                  <label htmlFor={key}>{key === "refnr" ? "Refnr" : key.charAt(0).toUpperCase() + key.slice(1)}</label>
                  <input
                    id={key}
                    name={key}
                    value={form[key]}
                    onChange={handleChange}
                    required={key === "refnr"}
                  />
                </div>
              ))}
            {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
            <div className="detail-actions">
              <button type="submit" disabled={saving}>{saving ? "Toevoegen..." : "Toevoegen"}</button>
              <button type="button" onClick={handleCancel} disabled={saving}>Annuleren</button>
            </div>
          </form>
        )}

        <div className={styles["document"]}>
          <div className={styles["document-item"]}>
            <p className="cursor-pointer" onClick={() => handleSort("refnr")}>Refnr {sortKey === "refnr" ? (sortDir === 1 ? "▲" : "▼") : ""}</p>
            <p className="cursor-pointer" onClick={() => handleSort("stock")}>Stock {sortKey === "stock" ? (sortDir === 1 ? "▲" : "▼") : ""}</p>
            <p className="cursor-pointer" onClick={() => handleSort("akp")}>AKP {sortKey === "akp" ? (sortDir === 1 ? "▲" : "▼") : ""}</p>
          </div>
          {visibleDocuments.length === 0 && <p>Geen resultaten gevonden.</p>}
          {visibleDocuments.map((document) => {
            const isLow = Number(document.stock) < LOW_STOCK_THRESHOLD;
            const isDup = dupSet.has(document._id);
            return (
              <div
                key={document._id}
                style={{
                  color: isDup ? "red" : undefined,
                  background: !isDup && isLow ? "rgba(255, 165, 0, 0.15)" : undefined,
                }}
              >
                <Link className={styles["document-item"]} href={`/${database}/${collection}/${slugFor(document)}`}>
                  <p>{document.refnr} - {document.modelnaam}</p>
                  <p>{document.stock}{isLow && !isDup ? " ⚠" : ""}</p>
                  <p>{document.akp}</p>
                </Link>
                <div style={{ display: "flex", gap: "0.5rem", paddingBottom: "10px" }}>
                  <button
                    type="button"
                    disabled={adjustingId === document._id}
                    onClick={(e) => { e.preventDefault(); handleStockAdjust(document, -1); }}
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    disabled={adjustingId === document._id}
                    onClick={(e) => { e.preventDefault(); handleStockAdjust(document, 1); }}
                  >
                    +1
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const { database, collection } = params;

  try {
    const client = await clientPromise;
    const db = client.db(database);

    const rawDocuments = await db.collection(collection).find({}).toArray();
    const documents = JSON.parse(JSON.stringify(rawDocuments));

    // Detect duplicates: documents where all relevant fields match another document
    const sigMap = new Map();
    documents.forEach((doc) => {
      const sig = [doc.refnr, doc.kleur, doc.modelnaam, doc.gender, doc.maat, doc.stock, doc.akp].join("|");
      if (!sigMap.has(sig)) sigMap.set(sig, []);
      sigMap.get(sig).push(doc._id);
    });
    const duplicateIds = [...sigMap.values()].filter((ids) => ids.length > 1).flat();

    return { props: { database, collection, documents, duplicateIds } };
  } catch (e) {
    console.error(`[${database}/${collection}] getServerSideProps error:`, e.message);
    return { props: { database, collection, documents: [] } };
  }
}
