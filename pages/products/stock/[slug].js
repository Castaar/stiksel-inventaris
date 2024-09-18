import React, { useState } from "react";

// DB connect
import clientPromise from "../../../lib/mongodb";

import Title from "../../../components/base/title";
import CategoryTitle from "../../../components/blocks/category-title";
import Search from "../../../components/base/search";
import Product from "../../../components/blocks/product";

export default function category(props) {
  const [searchInput, setSearchInput] = useState();

  return (
    <main className="main">
      <div>
        <Title value={"Stock producten"} url={"/stock"} />
        <div className="main-heading">
          <CategoryTitle />
          <Search setSearchInput={setSearchInput} />
        </div>
      </div>
      <div className="main-scroll">
        <Product
          name={"Omschrijving:"}
          format={"Formaat:"}
          number={"Productnummer:"}
          available={"Aantal m / stuks beschikbaar:"}
          edit={false}
        />
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
            return <Product key={index} {...product} edit={true} slug="stock" />;
          })}
      </div>
    </main>
  );
}

export async function getServerSideProps({ query }) {
  try {
    const client = await clientPromise;
    const db = client.db("stock");

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
      props: { products: JSON.parse(JSON.stringify(allItems)) },
    };
  } catch (e) {
    return { props: { error: JSON.parse(JSON.stringify(e)) } };
  }
}
