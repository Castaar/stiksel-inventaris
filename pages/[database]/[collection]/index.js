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

export default function CollectionPage({ database, collection, documents = [] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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
        </div>

        {adding && (
          <form className="detail" onSubmit={handleSubmit}>
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
            <div className="detail-actions">
              <button type="submit" disabled={saving}>{saving ? "Toevoegen..." : "Toevoegen"}</button>
              <button type="button" onClick={handleCancel} disabled={saving}>Annuleren</button>
            </div>
          </form>
        )}

        <div className={styles["document"]}>
          <div className={styles["document-item"]}>
            <p>Refnr</p>
            <p>Modelnaam</p>
            <p>AKP</p>
          </div>
          {documents.map((document, index) => (
            <div key={index}>
              <Link className={styles["document-item"]} href={`/${database}/${collection}/${document.refnr}-${(document.kleur ?? '').charAt(0)}`}>
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

    return { props: { database, collection, documents } };
  } catch (e) {
    console.error(`[${database}/${collection}] getServerSideProps error:`, e.message);
    return { props: { database, collection, documents: [] } };
  }
}
