import React from "react";
import clientPromise from "../lib/mongodb";

import Title from "../components/base/title";
import ProductAdd from "../components/blocks/stock-add";

import { toast } from "react-hot-toast";

import Link from "next/link";

import { useRouter } from 'next/router';

export default function Categories(props) {

  const router = useRouter();
  const { product } = router.query;

  return (
    <main className="main">

      <div className="title-block">
        <Link href="/stock">
          <div className="btn-secondary arrow-left">Terug</div>
        </Link>
        <Title value="Stock aanvullen." url={"/stock"} />
      </div>
      <ProductAdd
        selectedOption={product ? product : "Selecteer"}
        collections={props.collections}
        products={props.products}
        toast={toast}
      />
    </main>
  );
}

export async function getServerSideProps({ query }) {
  try {
    const client = await clientPromise;
    const db = client.db("stock");

    const collections = await db.listCollections().toArray();

    let allItems = [];
    if (query.collection) {
      const products = await db
        .collection(query.collection)
        .find({})
        .toArray();
      allItems = products;
    }

    return {
      props: {
        collections: JSON.parse(JSON.stringify(collections)),
        products: JSON.parse(JSON.stringify(allItems)),
      },
    };
  } catch (e) {
    console.error('Error in getServerSideProps (stock-aanvullen):', e);
    // Return empty arrays to prevent crashes
    return {
      props: {
        collections: [],
        products: [],
      },
    };
  }
}