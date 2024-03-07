import React from "react";

// DB connect
import clientPromise from "../lib/mongodb";

import Category from "../components/blocks/category";

export default function categories(props) {
  return (
    <main className="main">
      {props.collections.map((collection, index) => {
        return <Category key={index} title={collection.name} />;
      })}
    </main>
  );
}

export async function getServerSideProps() {
  try {
    const client = await clientPromise;
    const db = client.db("Folies");

    const collections = await db.listCollections().toArray();

    return {
      props: { collections: JSON.parse(JSON.stringify(collections)) },
    };
  } catch (e) {
    return { props: { error: JSON.parse(JSON.stringify(e)) } };
  }
}
