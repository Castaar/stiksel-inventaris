import React, { useState } from "react";
import { useRouter } from "next/router";

// DB connect
import clientPromise from "../../../lib/mongodb";

import Title from "../../../components/base/title";
import CategoryTitle from "../../../components/blocks/category-title";
import ProductItem from "../../../components/blocks/product-item";

import { ObjectId } from "mongodb";

import { toast } from 'react-hot-toast';

export default function category({ product }) {

  const router = useRouter();
  const [stockInput, setStockInput] = useState({
    Beschikbaar: product?.available,
    Naam: product?.name,
    Formaat: product?.format
  });

  // delete record
  const removeFromMongo = async () => {
    try {
      fetch(
        `${process.env.NODE_ENV === "development" ? "http" : "https"}://${
          process.env.NEXT_PUBLIC_API
        }/api/delete-borden?collection=${router.query?.cat}`,
        {
          method: "POST",
          body: JSON.stringify(product._id),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json",
          },
        }
      ).then(function (a) {
        
        if (a.ok) {
          toast.success(`Product is verwijderd`);
          router.push(`/products/borden/${router.query?.cat}`);
        } else {
          toast.error(`'t Spel es kapot`);
        }

      });
    } catch (error) {
      console.log(error);
      toast.error(`'t Spel es kapot`);
    }
  }

  // add data to MongoDB
  const updateToMongo = async () => {

    let data = {
      name: stockInput.Naam,
      available: Number(stockInput.Beschikbaar),
      format: stockInput.Formaat,
      _id: product._id,
    };

    try {
      fetch(
        `${process.env.NODE_ENV === "development" ? "http" : "https"}://${
          process.env.NEXT_PUBLIC_API
        }/api/update-borden?collection=${router.query?.cat}`,
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json",
          },
        }
      ).then(function (a) {
        a.ok ? toast.success(`De gegevens zijn bewaard`) : toast.error(`'t Spel es kapot`);
      });
    } catch (error) {
      console.log(error);
      toast.error(`'t Spel es kapot`);
    }
  }

  return (
    <main className="main">
      <Title value={"Borden producten"} url={`/products/${router.query.cat}`} />
      <div className="main-heading">
        <CategoryTitle title={router.query.cat} />
      </div>
      <div className="main-detail">
        <ProductItem
          input="text"
          value={product?.name} 
          label={"Naam"}
          stockInput={stockInput}
          setStockInput={setStockInput}
          disabled={false}
        />
        <ProductItem
          input="text"
          value={product?.format} 
          label={"Formaat"}
          stockInput={stockInput}
          setStockInput={setStockInput} 
          disabled={false}
        />
        <ProductItem
          input="text"
          value={product?._id} 
          label={"Artikelnr"}
          stockInput={stockInput}
          setStockInput={setStockInput}
          disabled={true}
        />
        <ProductItem
          input="number"
          value={product?.available}
          label={"Beschikbaar"}
          unit={product?.unit}
          stockInput={stockInput}
          setStockInput={setStockInput}
          disabled={false}
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
    const db = client.db("borden");

    let objectId;
    try {
      objectId = ObjectId.createFromHexString(query.slug)
    } catch (error) {
      console.log("Invalid ObjectId");
      return { props: { product: null } };
    }

    let document = await db?.collection(query.cat).findOne(objectId);
    
    return {
      props: { product: JSON.parse(JSON.stringify(document)) },
    };
  } catch (e) {
    return { props: { error: JSON.parse(JSON.stringify(e)) } };
  }
}
