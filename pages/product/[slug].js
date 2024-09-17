import React, { useState } from "react";
import { useRouter } from "next/router";

// DB connect
import clientPromise from "../../lib/mongodb";

import Title from "../../components/base/title";
import CategoryTitle from "../../components/blocks/category-title";
import ProductItem from "../../components/blocks/product-item";

export default function category({ product }) {
  const router = useRouter();
  const [stockInput, setStockInput] = useState({
    Beschikbaar: product?.available,
    Naam: product?.name,
    Formaat: product?.format
  });

  console.log(stockInput)

  // delete record
  const removeFromMongo = async () => {
    // delete data from MongoDB
    try {
      fetch(
        `${process.env.NODE_ENV === "development" ? "http" : "https"}://${
          process.env.NEXT_PUBLIC_API
        }/api/delete-record?collection=${router.query?.cat}`,
        {
          method: "POST",
          body: JSON.stringify(product),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json",
          },
        }
      ).then(function (a) {
        a.ok && router.push("/stock");
      });
    } catch (error) {
      console.log(error);
    }
  }

  // add data to MongoDB
  const updateToMongo = async () => {
    // create new data
    let data = {
      name: stockInput.Naam,
      available: stockInput.Beschikbaar,
      format: stockInput.Formaat,
      _id: product?._id,
    };

    try {
      fetch(
        `${process.env.NODE_ENV === "development" ? "http" : "https"}://${
          process.env.NEXT_PUBLIC_API
        }/api/update-record?collection=${router.query?.cat}`,
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json",
          },
        }
      ).then(function (a) {
        a.ok && router.push("/bevestiging");
      });
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <main className="main">
      <Title value={"Producten"} url={`/products/${router.query.cat}`} />
      <div className="main-heading">
        <CategoryTitle title={router.query.cat} />
      </div>
      <div className="main-detail">
        <ProductItem 
          value={product?.name} 
          label={"Naam"}
          stockInput={stockInput}
          setStockInput={setStockInput} 
        />
        <ProductItem 
          value={product?.format} 
          label={"Formaat"}
          stockInput={stockInput}
          setStockInput={setStockInput} 
        />
        <ProductItem 
          value={product?.number} 
          label={"Artikelnr"}
          stockInput={stockInput}
          setStockInput={setStockInput} 
        />
        <ProductItem
          value={product?.available}
          label={"Beschikbaar"}
          unit={product?.unit}
          stockInput={stockInput}
          setStockInput={setStockInput}
        />
      </div>
      <div className="btn-wrapper">
        <button className="btn" onClick={updateToMongo}>
          Bewaar
        </button>
        <button className="btn" onClick={removeFromMongo}>
          Verwijder
        </button>
      </div>
    </main>
  );
}

export async function getServerSideProps({ query }) {
  try {
    const client = await clientPromise;
    const db = client.db("stock");

    let filter = { number: query.slug };

    let document = await db?.collection(query.cat).findOne(filter);

    return {
      props: { product: JSON.parse(JSON.stringify(document)) },
    };
  } catch (e) {
    return { props: { error: JSON.parse(JSON.stringify(e)) } };
  }
}
