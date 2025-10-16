import React from "react";

// DB connect
import clientPromise from "../../lib/mongodb";

import Title from "../../components/base/title";
import Category from "../../components/blocks/category";

import Link from "next/link";

export default function categories(props) {
  const collections = props.collections || [];
  
  // Debug: log what we're receiving
  console.log('Borden collections received:', collections);
  
  return (
    <main className="main">
      <div className="title-block">
        <Title value={"Borden"} url={"/"} />
        <Link href="/borden-aanvullen">
          <div className="btn-secondary cross">Aanvullen</div>
        </Link>
      </div>
      <div className="main-list">
        {collections.length === 0 ? (
          <div className="no-products-found">
            <h2>Geen categorieën gevonden</h2>
            <Link href="/borden-aanvullen">
              <div className="btn-secondary cross">Aanvullen</div>
            </Link>
          </div>
        ) : (
          collections.map((collection, index) => {
            return <Category key={index} title={collection.name} slug="borden" />;
          })
        )}
      </div>
    </main>
  );
}

export async function getServerSideProps() {
  try {
    const client = await clientPromise;
    const db = client.db("borden");

    const collections = await db.listCollections().toArray();
    
    // Debug: log what we're getting from the database
    console.log('Borden - Collections from DB:', collections.length, 'collections');
    
    collections.sort((a, b) => a.name.localeCompare(b.name));

    return {
      props: { collections: JSON.parse(JSON.stringify(collections)) },
    };
  } catch (e) {
    console.error('Error in getServerSideProps (borden/index):', e);
    // Return empty array to prevent crashes
    return {
      props: { collections: [] },
    };
  }
}
