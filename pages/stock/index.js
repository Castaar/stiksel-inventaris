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
    console.log('[Stock Client] Props updated:', props);
    console.log('[Stock Client] props.collections:', props?.collections);
    
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
  console.log('[Stock Client] All props:', props);
  console.log('[Stock Client] collections state:', collections);
  
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
            <div style={{ marginTop: '20px' }}>
              <button 
                className="btn-secondary download" 
                onClick={handleReload}
                disabled={isLoading}
              >
                {isLoading ? 'Laden...' : 'Opnieuw laden'}
              </button>
            </div>
            <Link href="/stock-aanvullen">
              <div className="btn-secondary cross" style={{ marginTop: '20px' }}>Aanvullen</div>
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

export async function getServerSideProps(context) {
  // Helper function to fetch collections with retry
  const fetchCollections = async (retryCount = 0) => {
    try {
      console.log(`[Stock] Attempt ${retryCount + 1}: Starting getServerSideProps...`);
      
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
      
      // If no collections found and we haven't retried yet, retry once
      if (collections.length === 0 && retryCount === 0) {
        console.warn('[Stock] WARNING: No collections found, retrying once...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
        return fetchCollections(1); // Retry
      }
      
      if (collections.length === 0) {
        console.warn('[Stock] WARNING: No collections found after retry!');
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

      return {
        props: { 
          collections: serializedCollections
        },
      };
    } catch (e) {
      console.error(`[Stock] Error in getServerSideProps (attempt ${retryCount + 1}):`, e.message);
      
      // If error on first attempt, retry once
      if (retryCount === 0) {
        console.log('[Stock] Retrying after error...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchCollections(1);
      }
      
      console.error('[Stock] Full error after retry:', e);
      
      // Return empty array with error flag
      return {
        props: { 
          collections: [],
          error: e.message 
        },
      };
    }
  };

  return fetchCollections();
}
