import React from "react";

// DB connect
import clientPromise from "../../lib/mongodb";

import Title from "../../components/base/title";
import Category from "../../components/blocks/category";

import Link from "next/link";

export default function categories(props) {
  const collections = props.collections || [];
  
  return (
    <main className="main">
      <div className="title-block">
        <Title value={"Stock"} url={"/"} />
        <Link href="/stock-aanvullen">
          <div className="btn-secondary cross">Aanvullen</div>
        </Link>
      </div>
      <div className="main-list">
        {collections.length === 0 ? (
          <div className="no-products-found">
            <h2>Geen categorieën gevonden</h2>
            <Link href="/stock-aanvullen">
              <div className="btn-secondary cross">Aanvullen</div>
            </Link>
          </div>
        ) : (
          collections.map((collection, index) => {
            return <Category key={index} title={collection.name} slug="stock"/>;
          })
        )}
      </div>
    </main>
  );
}

export async function getServerSideProps() {
  try {
    console.log('[Stock] Starting getServerSideProps...');
    
    // Ensure MongoDB connection is established
    const client = await clientPromise;
    console.log('[Stock] MongoDB client connected');
    
    // Wait for connection to be ready
    await client.connect();
    console.log('[Stock] MongoDB connection established');
    
    const db = client.db("stock");
    console.log('[Stock] Database selected');

    const collections = await db.listCollections().toArray();
    console.log('[Stock] Collections fetched:', collections.length);
    
    if (collections.length === 0) {
      console.warn('[Stock] WARNING: No collections found in database!');
    }
    
    collections.sort((a, b) => a.name.localeCompare(b.name));

    return {
      props: { collections: JSON.parse(JSON.stringify(collections)) },
    };
  } catch (e) {
    console.error('[Stock] Error in getServerSideProps:', e.message);
    console.error('[Stock] Full error:', e);
    
    // Don't return empty array - let the error be visible
    throw new Error(`Failed to load collections: ${e.message}`);
  }
}
