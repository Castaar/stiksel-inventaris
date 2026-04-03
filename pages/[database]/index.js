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
        </div>

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

    const collections = await Promise.all(
      collectionList.map(async (col) => {
        const documents = await db.collection(col.name).find({}).toArray();

        return {
          collection: col.name,
          documents: JSON.parse(JSON.stringify(documents)),
        };
      })
    );

    return { props: { database, collections } };
  } catch (e) {
    console.error(`[${database}] getServerSideProps error:`, e.message);
    return { props: { database, collections: [] } };
  }
}
