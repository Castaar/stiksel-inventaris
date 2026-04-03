import React from "react";
import Head from "next/head";
import clientPromise from "../../lib/mongodb";
import styles from "../../styles/modules/_collection.module.scss";
import Link from "next/link";

export default function DatabasePage({ database, collections = [] }) {

  return (
    <>
      <Head>
        <title>Stiksel - {database}</title>
      </Head>
      <main className="main">
        <div className="main-title">
          <h1>{database}</h1>
        </div>
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
