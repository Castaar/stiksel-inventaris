import React from "react";

// DB connect
import clientPromise from "../../lib/mongodb";

// import Category from "../../components/blocks/category";

export default function category(props) {
  console.log(props);
  return (
    <main className="main">
      {props.products.map((product, index) => {
        return <p>{product.name}</p>;
      })}
    </main>
  );
}

export async function getServerSideProps({ query }) {
  try {
    const client = await clientPromise;
    const db = client.db("Folies");

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
