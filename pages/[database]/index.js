import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import clientPromise from "../../lib/mongodb";
import styles from "../../styles/modules/_collection.module.scss";
import Link from "next/link";

export default function DatabasePage({ database, collections = [] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [cleaning, setCleaning] = useState(false);
  const fileInputRef = React.useRef(null);

  function handleExport() {
    window.location.href = `/api/${database}/export`;
  }

  async function handleClean() {
    if (
      !window.confirm(
        `Weet je zeker dat je ALLE collecties in "${database}" wilt verwijderen? Dit kan niet ongedaan gemaakt worden.`
      )
    )
      return;
    setCleaning(true);
    setImportMsg(null);
    try {
      const res = await fetch(`/api/${database}/clean`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Leegmaken mislukt");
      setImportMsg(`Database leeggemaakt (${data.dropped.length} collectie(s) verwijderd)`);
      router.replace(router.asPath);
    } catch (e) {
      setImportMsg(e.message);
    } finally {
      setCleaning(false);
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/${database}/import`, {
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

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/${database}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Toevoegen mislukt");
      setAdding(false);
      setName("");
      router.replace(router.asPath);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setAdding(false);
    setName("");
    setError(null);
  }

  return (
    <>
      <Head>
        <title>Stiksel - {database}</title>
      </Head>
      <main className="main">
        <div className="main-title">
          <h1>{database}</h1>
          <button onClick={() => setAdding(true)}>Nieuwe collectie</button>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}>
            {importing ? "Importeren..." : "CSV importeren"}
          </button>
          <button onClick={handleExport}>CSV exporteren</button>
          <button
            onClick={handleClean}
            disabled={cleaning}
            style={{ color: "red", borderColor: "red" }}
            title="Tijdelijke knop om alle collecties in deze database te verwijderen"
          >
            {cleaning ? "Leegmaken..." : "⚠ Database leegmaken (tijdelijk)"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleImport}
          />
        </div>
        {importMsg && <p style={{ marginBottom: "1rem" }}>{importMsg}</p>}

        {adding && (
          <form className="detail" onSubmit={handleSubmit}>
            <div className="detail-row">
              <label htmlFor="collection">Naam</label>
              <input
                id="collection"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <div className="detail-actions">
              <button type="submit" disabled={saving}>{saving ? "Toevoegen..." : "Toevoegen"}</button>
              <button type="button" onClick={handleCancel} disabled={saving}>Annuleren</button>
            </div>
          </form>
        )}

        <div className={styles["collection"]}>
          {collections.map(({ collection }) => (
            <div key={collection}>
              <Link className={styles["collection-item"]} href={`/${database}/${collection}`}>{collection}</Link>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const { database } = params;

  try {
    const client = await clientPromise;
    const db = client.db(database);

    const collectionList = await db.listCollections().toArray();

    const collections = collectionList
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((col) => ({ collection: col.name }));

    return { props: { database, collections } };
  } catch (e) {
    console.error(`[${database}] getServerSideProps error:`, e.message);
    return { props: { database, collections: [] } };
  }
}
