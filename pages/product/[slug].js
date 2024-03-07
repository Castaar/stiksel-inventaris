import React from "react";
import { useRouter } from "next/router";

// DB connect
import clientPromise from "../../lib/mongodb";

import Title from "../../components/base/title";
import CategoryTitle from "../../components/blocks/category-title";
import ProductItem from "../../components/blocks/product-item";

export default function category({ product }) {
  const router = useRouter();

  return (
    <main className="main">
      <div>
        <Title value={"Producten"} url={`/products/${router.query.cat}`} />
        <div className="main-heading">
          <CategoryTitle title={router.query.cat} />
        </div>
      </div>
      <div className="main-detail">
        <div>
          <ProductItem value={product.name} />
          <ProductItem value={product.number} />
          <ProductItem value={product.available} />
        </div>
      </div>
    </main>
  );
}

export async function getServerSideProps({ query }) {
  try {
    const client = await clientPromise;
    const db = client.db("Folies");

    let filter = { number: parseInt(query.slug) };

    let document = await db?.collection(query.cat).findOne(filter);

    return {
      props: { product: JSON.parse(JSON.stringify(document)) },
    };
  } catch (e) {
    return { props: { error: JSON.parse(JSON.stringify(e)) } };
  }
}
