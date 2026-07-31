import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import clientPromise from "../../../lib/mongodb";

export default function DocumentPage({ database, collection, document: doc, slug }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(doc ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  if (!doc) {
    return (
      <main className="main">
        <p>Document niet gevonden.</p>
      </main>
    );
  }

  const refnr = doc.refnr;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/${database}/${collection}/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Opslaan mislukt");
      }
      setEditing(false);
      router.replace(router.asPath);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm(doc);
    setEditing(false);
    setError(null);
  }

  async function handleDelete() {
    if (!window.confirm(`Weet je zeker dat je ${refnr} wilt verwijderen?`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/${database}/${collection}/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Verwijderen mislukt");
      }
      router.push(`/${database}/${collection}`);
    } catch (e) {
      setError(e.message);
      setDeleting(false);
    }
  }

  const fields = [
    { key: "refnr", label: "Refnr" },
    { key: "modelnaam", label: "Modelnaam" },
    { key: "kleur", label: "Kleur" },
    { key: "gender", label: "Gender" },
    { key: "maat", label: "Maat" },
    { key: "stock", label: "Stock" },
    { key: "akp", label: "AKP" },
  ];

  return (
    <>
      <Head>
        <title>Stiksel - {refnr}</title>
      </Head>
      <main className="main">
        <div className="main-title">
          <h1>{form.modelnaam}</h1>
        </div>
        <div className={`detail${editing ? "" : " detail--view"}`}>
          {fields.map(({ key, label }) => {
            const value = form[key];
            if (value === undefined || value === null || value === "") return null;
            return (
              <div key={key} className="detail-row">
                <span>{label}</span>
                {editing ? (
                  <input
                    name={key}
                    value={form[key] ?? ""}
                    onChange={handleChange}
                  />
                ) : (
                  <span>{key === "akp" ? `€ ${Number(value).toFixed(2)}` : value}</span>
                )}
              </div>
            );
          })}
          {!editing && (
            <div className="detail-row">
              <span>Totale waarde</span>
              <span>€ {(Number(form.akp) * Number(form.stock)).toFixed(2)}</span>
            </div>
          )}
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div className="detail-actions">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving}>
                {saving ? "Opslaan..." : "Opslaan"}
              </button>
              <button onClick={handleCancel} disabled={saving}>
                Annuleren
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)}>Bewerken</button>
              <button onClick={handleDelete} disabled={deleting}>
                {deleting ? "Verwijderen..." : "Verwijderen"}
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const { database, collection, refnr: slug } = params;
  const lastDash = slug.lastIndexOf('-');
  const refnr = slug.substring(0, lastDash);
  const colorInitial = slug.substring(lastDash + 1).replace(/[^a-z]/gi, '');
  const colorRegex = colorInitial.length > 1
    ? colorInitial.split('').map((c, i) => i === 0 ? `^${c}\\w*` : `\\s+${c}\\w*`).join('')
    : `^${colorInitial}`;

  try {
    const client = await clientPromise;
    const db = client.db(database);

    const query = { refnr, ...(colorInitial ? { kleur: { $regex: colorRegex, $options: 'i' } } : {}) };
    const raw = await db.collection(collection).findOne(query);

    if (!raw) {
      return { props: { database, collection, document: null, slug } };
    }

    const doc = JSON.parse(JSON.stringify(raw));

    return { props: { database, collection, document: doc, slug } };
  } catch (e) {
    console.error(`[${database}/${collection}/${slug}] getServerSideProps error:`, e.message);
    return { props: { database, collection, document: null, slug } };
  }
}
