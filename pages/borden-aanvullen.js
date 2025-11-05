import React from "react";
import clientPromise from "../lib/mongodb";

import Title from "../components/base/title";
import ProductAdd from "../components/blocks/borden-add";

import { toast } from "react-hot-toast";

import Link from "next/link";
import { useRouter } from 'next/router';

export default function Categories(props) {

  const router = useRouter();
  const { product } = router.query;
  const [isReloading, setIsReloading] = React.useState(false);

  const handleReload = () => {
    setIsReloading(true);
    router.replace(router.asPath);
  };

  // Check if we have data
  const hasCollections = Array.isArray(props?.collections) && props.collections.length > 0;
  const hasProducts = Array.isArray(props?.products) && props.products.length > 0;
  const showReloadButton = !hasCollections;

  return (
    <main className="main">
      <div className="title-block">
        <Link href="/borden">
          <div className="btn-secondary arrow-left">Terug</div>
        </Link>
        <Title value="Borden aanvullen." url={"/borden"} />
      </div>
      {showReloadButton ? (
        <div className="no-products-found">
          <h2>Geen gegevens geladen</h2>
          <p>De collecties konden niet worden geladen.</p>
          <div style={{ marginTop: '20px' }}>
            <button 
              className="btn-secondary download" 
              onClick={handleReload}
              disabled={isReloading}
            >
              {isReloading ? 'Laden...' : 'Opnieuw laden'}
            </button>
          </div>
        </div>
      ) : (
        <ProductAdd
          selectedOption={product ? product : "Selecteer"}
          collections={props.collections}
          products={props.products}
          toast={toast}
        />
      )}
    </main>
  );
}

export async function getServerSideProps({ query }) {
  try {
    const client = await clientPromise;
    const db = client.db("borden");

    const collections = await db.listCollections().toArray();

    let allItems = [];
    if (query.collection) {
      const products = await db
        .collection(query.collection)
        .find({})
        .toArray();
      allItems = products;
    }

    return {
      props: {
        collections: JSON.parse(JSON.stringify(collections)),
        products: JSON.parse(JSON.stringify(allItems)),
      },
    };
  } catch (e) {
    console.error('Error in getServerSideProps (borden-aanvullen):', e);
    // Return empty arrays to prevent crashes
    return {
      props: {
        collections: [],
        products: [],
      },
    };
  }
}