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

export default function CollectionPage({ database, collection, documents = [], duplicateIds = [] }) {
  const dupSet = new Set(duplicateIds);
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const fileInputRef = React.useRef(null);

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
            <p>Refnr</p>
            <p>Stock</p>
            <p>AKP</p>
          </div>
          {documents.map((document, index) => (
            <div key={index} style={dupSet.has(document._id) ? { color: "red" } : undefined}>
              <Link className={styles["document-item"]} href={`/${database}/${collection}/${document.refnr}-${(document.kleur ?? '').trim().split(/\s+/).filter(w => /^[a-zA-Z]/.test(w)).map(w => w.charAt(0)).join('')}`}>
                <p>{document.refnr} - {document.modelnaam}</p>
                <p>{document.stock}</p>
                <p>{document.akp}</p>
              </Link>
            </div>
          ))}
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
