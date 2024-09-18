import React from "react";
import Head from "next/head";

import clientPromise from "../lib/mongodb";

import InfoBlock from "../components/blocks/info-block";

export default function home(props) {
  return (
    <>
      <Head>
        <title>Home | Castaar Inventaris</title>
        <meta name="description" content="Castaar stock inventaris" />
        <link rel="icon" href="/images/favicon.svg" />
      </Head>
      <main className="main main-overview">
        {/* <InfoBlock
          value={`€ ${props.totalPrice}`}
          title={"Waarde totale stock"}
        /> */}
        <InfoBlock value={"XX M2"} title={"Borden"} />
      </main>
    </>
  );
}

export async function getServerSideProps({ query }) {
  try {
    const client = await clientPromise;
    const db = client.db("stock");

    const collections = await db.listCollections().toArray();

    let totalPrice = 0;

    for (const collection of collections) {
      const collectionName = collection.name;
      let toSkip = 0;
      let toContinue = true;

      while (toContinue) {
        const results = await db
          .collection(collectionName)
          .find({})
          .skip(toSkip)
          .limit(20)
          .toArray();

        for (const product of results) {
          totalPrice += product.price; // Assumes each product has a 'price' field
        }

        toSkip += 20;
        if (results.length < 20) {
          toContinue = false;
        }
      }
    }

    return {
      props: {
        totalPrice: totalPrice,
      },
    };
  } catch (e) {
    return { props: { error: JSON.parse(JSON.stringify(e)) } };
  }
}
