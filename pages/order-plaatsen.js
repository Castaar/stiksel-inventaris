import React, { useState } from "react";

// DB connect
// import clientPromise from "../lib/mongodb";

import Title from "../components/base/title";
import Search from "../components/base/search";

export default function categories(props) {
  const [searchInput, setSearchInput] = useState();

  return (
    <main className="main">
      <div>
        <Title value={"Producten"} url={"/categories"} />
        <div className="main-heading">
          <Search setSearchInput={setSearchInput} />
        </div>
      </div>
      {/* <div className="main-list">
        {props.collections.map((collection, index) => {
          return <Category key={index} title={collection.name} />;
        })}
      </div> */}
    </main>
  );
}

export async function getServerSideProps() {
  try {
    // const client = await clientPromise;
    // const db = client.db("Folies");

    // const collections = await db.listCollections().toArray();

    return {
      props: {},
    };
  } catch (e) {
    return { props: { error: JSON.parse(JSON.stringify(e)) } };
  }
}
