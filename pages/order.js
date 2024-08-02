import React, { useState } from "react";
import { useRouter } from "next/router";

// DB connect
import clientPromise from "../lib/mongodb";

import Title from "../components/base/title";
import Search from "../components/base/search";
import Dropdown from "../components/base/dropdown";
import Product from "../components/blocks/select-product";
import ProductItemEdit from "../components/blocks/product-item-edit";

export default function categories(props) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");

  return (
    <main className="main">
      <div>
        <Title value={"XX"} url={"/stock"} />
        <div className="main-heading">
          {/* <Dropdown collections={props.collections} /> */}
          {/* <Search setSearchInput={setSearchInput} /> */}
        </div>
      </div>
      <div className="main-detail">
        <div>
          <ProductItemEdit />
        </div>
      </div>
    </main>
  );
}

export async function getServerSideProps({ query }) {
  try {
    const client = await clientPromise;
    const db = client.db("Folies");

    const collections = await db.listCollections().toArray();

    // const allItems = [];
    // if (query.collection) {
    //   let toSkip = 0;
    //   let toContinue = true;
    //   while (toContinue) {
    //     const results = await db
    //       ?.collection(query.collection)
    //       .find({})
    //       .skip(toSkip)
    //       .limit(20)
    //       .toArray();
    //     allItems.push(...results);
    //     toSkip += 20;
    //     if (results.length < 20) {
    //       toContinue = false;
    //     }
    //   }
    // }

    return {
      props: {
        // collections: JSON.parse(JSON.stringify(collections)),
        // products: JSON.parse(JSON.stringify(allItems)),
      },
    };
  } catch (e) {
    return { props: { error: JSON.parse(JSON.stringify(e)) } };
  }
}
