import React from "react";

// DB connect
import clientPromise from "../../lib/mongodb";

import Title from "../../components/base/title";
import Category from "../../components/blocks/category";

export default function categories(props) {
  return (
    <main className="main">
      <Title value={"Borden"} url={"/"} />
      <div className="main-list">
        {props.collections.map((collection, index) => {
          return <Category key={index} title={collection.name} slug="borden"/>;
        })}
      </div>
    </main>
  );
}

export async function getServerSideProps() {
  try {
    const client = await clientPromise;
    const db = client.db("borden");

    const collections = await db.listCollections().toArray();
    collections.sort((a, b) => a.name.localeCompare(b.name));

    return {
      props: { collections: JSON.parse(JSON.stringify(collections)) },
    };
  } catch (e) {
    return { props: { error: JSON.parse(JSON.stringify(e)) } };
  }
}
