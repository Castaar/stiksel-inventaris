import React from "react";
import Head from "next/head";

import clientPromise from "../lib/mongodb";

import InfoBlock from "../components/blocks/info-block";

import Link from "next/link";

export default function home(props) {
  return (
    <>
      <Head>
        <title>Home | Castaar Inventaris</title>
        <meta name="description" content="Castaar stock inventaris" />
        <link rel="icon" href="/images/favicon.svg" />
      </Head>
      <main className="main main-overview">
        <div className="d-flex justify-content-space-between flex-wrap w-100 btn-menu">
          <Link href="/stock">
            Stock
          </Link>
          <Link href="/borden">
            Borden
          </Link>
        </div>
        <InfoBlock
          value={`€ ${props.stock.price.total}`}
          title={"Waarde totale stock"}
        />
        <div className="mt-40">
          <InfoBlock
            value={`€ ${props.borden.price.total}`}
            title={"Waarde totale borden"}
          />
        </div>
        {/* <div className="mt-40">
          <InfoBlock value={"XX M2"} title={"Borden"} />
        </div> */}
      </main>
    </>
  );
}

export async function getServerSideProps({ query }) {
  try {
    
    const totalPriceStock = await calculateTotalPriceForDB('stock');
    const totalPriceBorden = await calculateTotalPriceForDB('borden');

    return {
      props: {
        stock: {
          price: {
            total: totalPriceStock
          }
        },
        borden: {
          price: {
            total: totalPriceBorden
          }
        }
      },
    };
  } catch (e) {
    return { props: { error: JSON.parse(JSON.stringify(e)) } };
  }
}

async function calculateTotalPriceForDB(dbName) {
  try {
      const client = await clientPromise;
      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();
      
      let totalPrice = 0;

      for (const collection of collections) {
          const collectionName = collection.name;
          const coll = db.collection(collectionName);
          
          const documents = await coll.find({}).toArray();
          
          const collectionPrice = documents.reduce((sum, doc) => {
              if (doc.price && !isNaN(doc.price)) {
                  return sum + doc.price;
              }
              return sum;
          }, 0);

          totalPrice += collectionPrice;
      }

      return totalPrice;
  } catch (error) {
      console.error(`Error calculating total price for database ${dbName}:`, error);
      return 1000000;
  }
}