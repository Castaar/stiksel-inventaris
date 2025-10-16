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
    console.log('[Borden] Starting getServerSideProps...');
    
    // Ensure MongoDB connection is established
    const client = await clientPromise;
    console.log('[Borden] MongoDB client connected');
    
    // Wait for connection to be ready
    await client.connect();
    console.log('[Borden] MongoDB connection established');
    
    const db = client.db("borden");
    console.log('[Borden] Database selected');

    const collections = await db.listCollections().toArray();
    console.log('[Borden] Collections fetched:', collections.length);
    
    if (collections.length === 0) {
      console.warn('[Borden] WARNING: No collections found in database!');
    }
    
    collections.sort((a, b) => a.name.localeCompare(b.name));

    return {
      props: { collections: JSON.parse(JSON.stringify(collections)) },
    };
  } catch (e) {
    console.error('[Borden] Error in getServerSideProps:', e.message);
    console.error('[Borden] Full error:', e);
    
    // Don't return empty array - let the error be visible
    throw new Error(`Failed to load collections: ${e.message}`);
  }
}
