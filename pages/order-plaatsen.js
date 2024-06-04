import React, { useState } from "react";
import { useRouter } from "next/router";

// DB connect
import clientPromise from "../lib/mongodb";

import Title from "../components/base/title";
import Search from "../components/base/search";
import Dropdown from "../components/base/dropdown";
import DropdownProducts from "../components/base/dropdown-products";
import Product from "../components/blocks/select-product";

import styles from "../styles/blocks/_category-title.module.scss";

export default function order(props) {
  const router = useRouter();

  const [stockInput, setStockInput] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  const saveToMongo = async () => {
    // get old data
    let productOld = props.products
      .filter((product) => product._id === stockInput._id)
      .map((product) => {
        return product;
      });

    // create new data
    let data = {
      state: false,
      _id: productOld[0]?._id,
      name: productOld[0]?.name,
      format: productOld[0]?.format,
      price: productOld[0]?.price,
      number: productOld[0]?.number,
      unit: productOld[0]?.unit,
      available: productOld[0]?.available - stockInput.available,
    };

    if (data.available >= 0) {
      // add data to MongoDB
      setErrorMessage("");
      try {
        fetch(
          `${process.env.NODE_ENV === "development" ? "http" : "https"}://${
            process.env.NEXT_PUBLIC_API
          }/api/add-stock?collection=${router.query?.collection}`,
          {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
              Accept: "application/json, text/plain, */*",
              "Content-Type": "application/json",
            },
          }
        ).then(function (a) {
          a.ok &&
            fetch(
              `${process.env.NODE_ENV === "development" ? "http" : "https"}://${
                process.env.NEXT_PUBLIC_API
              }/api/mailing`,
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
        });
      } catch (error) {
        console.log(error);
      }
    } else {
      setErrorMessage("Dit gaat niet door want er is niet genoeg voorraad");
    }
  };

  return (
    <main className="main">
      <div>
        <Title value={"Order plaatsen"} url={"/stock"} />
        <div className="main-heading">
          <Dropdown collections={props.collections} />
          {router.query?.collection && (
            <DropdownProducts
              collections={props.products}
              setStockInput={setStockInput}
              stockInput={stockInput}
            />
          )}
        </div>
      </div>
      <div className="main-list-stock">
        {router.query?.state === "new" && (
          <div className={styles["category"]}>
            <input
              className={styles["category-search"]}
              placeholder="Omschrijving"
              onChange={(e) =>
                setStockInput((stockInput) => ({
                  ...stockInput,
                  name: e.target.value,
                }))
              }
              defaultValue={stockInput.name}
            />
          </div>
        )}
        {router.query?.state === "new" && (
          <div className={styles["category"]}>
            <input
              className={styles["category-search"]}
              placeholder="Formaat"
              onChange={(e) =>
                setStockInput((stockInput) => ({
                  ...stockInput,
                  format: `${e.target.value} cm`,
                }))
              }
            />
          </div>
        )}
        <div className={styles["category"]}>
          <input
            className={styles["category-search"]}
            placeholder="Aantal m / stuks"
            type="number"
            onChange={(e) =>
              setStockInput((stockInput) => ({
                ...stockInput,
                available: Number(e.target.value),
              }))
            }
          />
        </div>
        {router.query?.state === "new" && (
          <div className={styles["category"]}>
            <input
              className={styles["category-search"]}
              placeholder="Eenheid"
              onChange={(e) =>
                setStockInput((stockInput) => ({
                  ...stockInput,
                  unit: e.target.value,
                }))
              }
              defaultValue={stockInput.unit}
            />
          </div>
        )}
        {router.query?.state === "new" && (
          <div className={styles["category"]}>
            <input
              className={styles["category-search"]}
              placeholder="Nummer"
              type="number"
              onChange={(e) =>
                setStockInput((stockInput) => ({
                  ...stockInput,
                  number: Number(e.target.value),
                }))
              }
            />
          </div>
        )}
        {router.query?.state === "new" && (
          <div className={styles["category"]}>
            <input
              className={styles["category-search"]}
              placeholder="Prijs"
              type="number"
              onChange={(e) =>
                setStockInput((stockInput) => ({
                  ...stockInput,
                  price: Number(e.target.value),
                }))
              }
            />
          </div>
        )}
      </div>
      <div className="btn-wrapper">
        {errorMessage && <p>{errorMessage}</p>}
        <button className="btn" onClick={saveToMongo}>
          Plaatsen
        </button>
      </div>
    </main>
  );
}

export async function getServerSideProps({ query }) {
  try {
    const client = await clientPromise;
    const db = client.db("Folies");

    const collections = await db.listCollections().toArray();

    const allItems = [];
    if (query.collection) {
      let toSkip = 0;
      let toContinue = true;
      while (toContinue) {
        const results = await db
          ?.collection(query.collection)
          .find({})
          .skip(toSkip)
          .limit(20)
          .toArray();
        allItems.push(...results);
        toSkip += 20;
        if (results.length < 20) {
          toContinue = false;
        }
      }
    }

    return {
      props: {
        collections: JSON.parse(JSON.stringify(collections)),
        products: JSON.parse(JSON.stringify(allItems)),
      },
    };
  } catch (e) {
    return { props: { error: JSON.parse(JSON.stringify(e)) } };
  }
}
