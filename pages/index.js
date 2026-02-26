import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import clientPromise from "../lib/mongodb";

export default function Home({ databases = []}) {

  console.log(databases);

  return (
    <>
      <Head>
        <title>Stockbeheer</title>
        <meta name="description" content="Stockbeheer voor de organisatie" />
      </Head>
      <main className="main">
        
      </main>
    </>
  );
}

export async function getServerSideProps() {
  try {
    const client = await clientPromise;

    // Use admin interface
    const admin = client.db().admin();

    const { databases } = await admin.listDatabases();

    // Filter out unwanted system databases
    const filteredDatabases = databases
      .filter(
        (db) => db.name !== "admin" && db.name !== "local"
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((db) => ({
        name: String(db.name),
      }));

    return { props: { databases: filteredDatabases } };
  } catch (e) {
    console.error("[Index] getServerSideProps error:", e.message);
    return { props: { databases: [] } };
  }
}
