import React from "react";
import Head from "next/head";
import clientPromise from "../lib/mongodb";
import styles from "../styles/modules/_totals.module.scss";
import Link from "next/link";

export default function Home({ databases = [], totalValue = 0 }) {

  return (
    <>
      <Head>
        <title>Stockbeheer</title>
        <meta name="description" content="Stockbeheer voor de organisatie" />
      </Head>
      <main className="main">
        <nav className="navigation">
          {databases.map(({ name}) => (
            <div key={name} className="database">
              <Link href={`/${name}`}>{name}</Link>
            </div>
          ))}
        </nav>
        <div className={styles["total-blocks"]}>
          <div className={styles["total-block"]}>
            <span>€ {totalValue.toFixed(2)}</span>
            <p>Totale waarde inventaris</p>
          </div>
          {databases.map(({ name, totalValue: dbTotal }) => (
            <div key={name} className={styles["total-block"]}>
              <span>€ {dbTotal.toFixed(2)}</span>
              <p>Totale waarde {name}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps() {
  try {
    const client = await clientPromise;

    const admin = client.db().admin();
    const { databases } = await admin.listDatabases();

    const filteredDatabases = databases
      .filter((db) => db.name !== "admin" && db.name !== "local")
      .sort((a, b) => a.name.localeCompare(b.name));

    const databasesWithTotals = await Promise.all(
      filteredDatabases.map(async (db) => {
        const database = client.db(db.name);
        const collectionList = await database.listCollections().toArray();

        let dbTotal = 0;
        for (const col of collectionList) {
          const docs = await database
            .collection(col.name)
            .find({}, { projection: { akp: 1, stock: 1 } })
            .toArray();
          for (const doc of docs) {
            dbTotal += (Number(doc.akp) || 0) * (Number(doc.stock) || 0);
          }
        }

        return { name: String(db.name), totalValue: dbTotal };
      })
    );

    const totalValue = databasesWithTotals.reduce((sum, db) => sum + db.totalValue, 0);

    return { props: { databases: databasesWithTotals, totalValue } };
  } catch (e) {
    console.error("[Index] getServerSideProps error:", e.message);
    return { props: { databases: [], totalValue: 0 } };
  }
}
