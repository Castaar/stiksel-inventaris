import React, { useState } from "react";

// DB connect
import clientPromise from "../../../lib/mongodb";

import Title from "../../../components/base/title";
import CategoryTitle from "../../../components/blocks/category-title";
import Search from "../../../components/base/search";
import Product from "../../../components/blocks/product";

import Link from "next/link";

import styles from "../../../styles/blocks/_product.module.scss";

export default function category(props) {
  const [searchInput, setSearchInput] = useState();

  console.log(props)

  return (
    <main className="main">
      <div>
        <div className="title-block">
          <Link href="/borden">
            <div className="btn-secondary arrow-left">Terug</div>
          </Link>
          <Title value={`${props.slug}.`} url={"/borden"} />
        </div>
      </div>
      {
        props.products.length !== 0 &&
        <div className="search-container">
          <div className="search-block">
            <Search setSearchInput={setSearchInput} />
          </div>
        </div>
      }
      <div className="main-scroll">
       
        {
          props.products.length === 0 ?
            <div className="no-products-found">
              <h2>Geen producten gevonden</h2>
              <Link href={`/borden-aanvullen?product=${props.slug}`}>
                <div className="btn-secondary cross">Aanvullen</div>
              </Link>
            </div>
            :
            <Product
              name={"Naam:"}
              format={"Dikte (mm):"}
              number={"Productnummer:"}
              available={"Beschikbaar (m):"}
              edit={false}
            />
        }
        {props.products
          .filter((product) => {
            let productName = product.name?.toLowerCase();
            if (searchInput) {
              if (productName.includes(searchInput.toLowerCase())) {
                return product;
              } else {
                return "";
              }
            } else {
              return product;
            }
          })
          .sort((a, b) => a.name?.localeCompare(b.name))
          .map((product, index) => {
            return <Product key={index} {...product} edit={true} slug="borden" />;
          })}
      </div>
    </main>
  );
}

export async function getServerSideProps({ query }) {
  try {
    const client = await clientPromise;
    const db = client.db("borden");

    const allItems = [];
    let toSkip = 0;
    let toContinue = true;
    while (toContinue) {
      const results = await db
        ?.collection(query.slug)
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

    return {
      props: { products: JSON.parse(JSON.stringify(allItems)), slug: query.slug },
    };
  } catch (e) {
    return { props: { error: JSON.parse(JSON.stringify(e)) } };
  }
}
