import React from "react";

// DB connect
import clientPromise from "../../lib/mongodb";

import Title from "../../components/base/title";
import Category from "../../components/blocks/category";

import Link from "next/link";

export default function categories(props) {
  // Debug: log what props we're receiving
  console.log('[Stock Client] All props:', props);
  console.log('[Stock Client] props.collections:', props.collections);
  
  // Ensure collections is always an array
  const collections = Array.isArray(props.collections) ? props.collections : [];
  
  // Debug: log what we're receiving
  console.log('Stock collections received:', collections);
  console.log('Stock collections is array?', Array.isArray(collections));
  console.log('Stock collections length:', collections.length);
  
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
    console.log('[Stock] Collection structure:', JSON.stringify(collections[0])); // Log first collection
    
    if (collections.length === 0) {
      console.warn('[Stock] WARNING: No collections found in database!');
    }
    
    collections.sort((a, b) => a.name.localeCompare(b.name));

    // Serialize collections properly - ensure plain objects
    const serializedCollections = collections.map(col => {
      return {
        name: String(col.name || ''),
        type: String(col.type || 'collection')
      };
    });
    
    console.log('[Stock] Serialized collections:', serializedCollections.length);
    console.log('[Stock] First serialized:', JSON.stringify(serializedCollections[0]));

    const result = {
      props: { 
        collections: serializedCollections
      },
    };
    
    console.log('[Stock] Returning props with', result.props.collections.length, 'collections');
    
    return result;
  } catch (e) {
    console.error('[Stock] Error in getServerSideProps:', e.message);
    console.error('[Stock] Full error:', e);
    
    // Return empty array with error flag
    return {
      props: { 
        collections: [],
        error: e.message 
      },
    };
  }
}
