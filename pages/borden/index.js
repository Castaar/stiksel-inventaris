import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

// DB connect
import clientPromise from "../../lib/mongodb";

import Title from "../../components/base/title";
import Category from "../../components/blocks/category";

import Link from "next/link";

export default function categories(props) {
  const router = useRouter();
  
  // Initialize with empty array if props.collections is undefined
  const initialCollections = Array.isArray(props?.collections) ? props.collections : [];
  const [collections, setCollections] = useState(initialCollections);
  const [isLoading, setIsLoading] = useState(false);
  
  // Update collections when props change
  useEffect(() => {
    console.log('[Borden Client] Props updated:', props);
    console.log('[Borden Client] props.collections:', props?.collections);
    
    if (Array.isArray(props?.collections) && props.collections.length > 0) {
      setCollections(props.collections);
      setIsLoading(false);
    }
  }, [props?.collections]);
  
  // Manual reload function
  const handleReload = () => {
    setIsLoading(true);
    router.replace(router.asPath);
  };
  
  // Debug: log what we're receiving
  console.log('[Borden Client] All props:', props);
  console.log('[Borden Client] collections state:', collections);
  
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
            <div style={{ marginTop: '20px' }}>
              <button 
                className="btn-secondary download" 
                onClick={handleReload}
                disabled={isLoading}
              >
                {isLoading ? 'Laden...' : 'Opnieuw laden'}
              </button>
            </div>
            <Link href="/borden-aanvullen">
              <div className="btn-secondary cross" style={{ marginTop: '20px' }}>Aanvullen</div>
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
    console.log('[Borden] Collection structure:', JSON.stringify(collections[0])); // Log first collection
    
    if (collections.length === 0) {
      console.warn('[Borden] WARNING: No collections found in database!');
    }
    
    collections.sort((a, b) => a.name.localeCompare(b.name));

    // Serialize collections properly - ensure plain objects
    const serializedCollections = collections.map(col => {
      return {
        name: String(col.name || ''),
        type: String(col.type || 'collection')
      };
    });
    
    console.log('[Borden] Serialized collections:', serializedCollections.length);
    console.log('[Borden] First serialized:', JSON.stringify(serializedCollections[0]));

    const result = {
      props: { 
        collections: serializedCollections
      },
    };
    
    console.log('[Borden] Returning props with', result.props.collections.length, 'collections');
    
    return result;
  } catch (e) {
    console.error('[Borden] Error in getServerSideProps:', e.message);
    console.error('[Borden] Full error:', e);
    
    // Return empty array with error flag
    return {
      props: { 
        collections: [],
        error: e.message 
      },
    };
  }
}
