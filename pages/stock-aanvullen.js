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

export default function categories(props) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [stockInput, setStockInput] = useState({});

  let productsResult;
  props.products.filter((product) => {
    let productName = product.name.toLowerCase();
    if (searchInput) {
      if (productName.includes(searchInput.toLowerCase())) {
        productsResult = product;
      } else {
        return "";
      }
    }
  });

  console.log(stockInput);

  return (
    <main className="main">
      <div>
        <Title value={"Stock aanvullen"} url={"/stock"} />
        <div className="main-heading">
          <Dropdown collections={props.collections} />
          {router.query?.collection && (
            <DropdownProducts collections={props.products} />
          )}
          {/* <Search
            setSearchInput={setSearchInput}
            productSearchInfo={productsResult}
          /> */}
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
                  format: e.target.value,
                }))
              }
              defaultValue={stockInput.name}
            />
          </div>
        )}
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
        <div className={styles["category"]}>
          <input
            className={styles["category-search"]}
            placeholder="Aantal m / stuks"
            type="number"
            onChange={(e) =>
              setStockInput((stockInput) => ({
                ...stockInput,
                format: Number(e.target.value),
              }))
            }
          />
        </div>
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
      </div>
      <div className="btn-wrapper">
        <button className="btn">Bewaar</button>
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
