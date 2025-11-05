import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

// DB connect
import clientPromise from "../../../lib/mongodb";
import { getCollectionDefaults } from "../../../lib/collection-defaults";

import Title from "../../../components/base/title";
import CategoryTitle from "../../../components/blocks/category-title";
import ProductItem from "../../../components/blocks/product-item";

import { ObjectId } from "mongodb";

import { toast } from 'react-hot-toast';

import Link from "next/link";

export default function category({ product }) {

  const router = useRouter();
  
  // Check if product has price, if not use default from collection
  const getInitialPrice = () => {
    if (product?.price_per_square_meter && product.price_per_square_meter !== 0) {
      return product.price_per_square_meter;
    }
    // Try to get default price for this collection
    const defaults = getCollectionDefaults(router.query?.cat);
    return defaults.price_per_square_meter || 0;
  };

  const [stockInput, setStockInput] = useState({
    Beschikbaar: product?.available,
    Naam: product?.name,
    Thickness: product?.thickness,
    PricePerSquareMeter: getInitialPrice(),
    WidthCm: product?.width_cm,
    HeightCm: product?.height_cm,
    AfgewerktFormaat: product?.afgewerkt_formaat || ''
  });

  // Watch for name changes and auto-parse dimensions
  useEffect(() => {
    if (stockInput.Naam) {
      // Match numbers with optional comma or dot as decimal separator
      // Matches patterns like: "305,5 X 40,8" or "97 x 24" or "100.5x50.5"
      const match = stockInput.Naam.match(/(\d+[,.]?\d*)\s*[xX×]\s*(\d+[,.]?\d*)/);
      if (match) {
        // Replace comma with dot for parseFloat
        const width = parseFloat(match[1].replace(',', '.'));
        const height = parseFloat(match[2].replace(',', '.'));
        // Only update if dimensions actually changed
        if (stockInput.WidthCm !== width || stockInput.HeightCm !== height) {
          setStockInput(prev => ({
            ...prev,
            WidthCm: width,
            HeightCm: height
          }));
        }
      }
    }
  }, [stockInput.Naam]);

  // delete record
  const removeFromMongo = async () => {
    try {
      fetch(
        `/api/delete-borden?collection=${router.query?.cat}`,
        {
          method: "POST",
          body: JSON.stringify(product._id),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json",
          },
        }
      ).then(function (a) {
        
        if (a.ok) {
          toast.success(`Product is verwijderd`);
          router.push(`/products/borden/${router.query?.cat}`);
        } else {
          toast.error(`'t Spel es kapot!`);
        }

      });
    } catch (error) {
      console.log(error);
      toast.error(`'t Spel es kapot`);
    }
  }

  // add data to MongoDB
  const updateToMongo = async () => {

    let data = {
      name: stockInput.Naam,
      available: Number(stockInput.Beschikbaar),
      thickness: Number(stockInput.Thickness),
      price_per_square_meter: Number(stockInput.PricePerSquareMeter),
      width_cm: Number(stockInput.WidthCm) || 0,
      height_cm: Number(stockInput.HeightCm) || 0,
      afgewerkt_formaat: stockInput.AfgewerktFormaat,
      _id: product._id,
    };

    console.log('Saving data:', data); // Debug log

    try {
      fetch(
        `/api/update-borden?collection=${router.query?.cat}`,
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json",
          },
        }
      ).then(function (a) {
        a.ok ? toast.success(`De gegevens zijn bewaard`) : toast.error(`'t Spel es kapot`);
      });
    } catch (error) {
      console.log(error);
      toast.error(`'t Spel es kapot`);
    }
  }

  return (
    <main className="main">
      <div>
        <div className="title-block">
          <Link href={`/products/borden/${router.query.cat}`}>
            <div className="btn-secondary arrow-left">Terug</div>
          </Link>
          <Title value={`${router.query.cat}.`} url={`/products/${router.query.cat}`} />
        </div>        
      </div>
      <div className="main-detail">
        <ProductItem
          input="text"
          value={product?.name} 
          label={"Naam"}
          db_key={"Naam"}
          stockInput={stockInput}
          setStockInput={setStockInput}
          disabled={false}
          placeholder="Vul een naam in (bijv. 97 X 24)"
        />
        <ProductItem
          input="number"
          value={product?.width_cm} 
          label={"Breedte (cm)"}
          db_key={"WidthCm"}
          stockInput={stockInput}
          setStockInput={setStockInput} 
          disabled={false}
          placeholder="Breedte in cm"
        />
        <ProductItem
          input="number"
          value={product?.height_cm} 
          label={"Hoogte (cm)"}
          db_key={"HeightCm"}
          stockInput={stockInput}
          setStockInput={setStockInput} 
          disabled={false}
          placeholder="Hoogte in cm"
        />
        <ProductItem
          input="number"
          value={product?.thickness} 
          label={"Dikte (mm)"}
          db_key={"Thickness"}
          stockInput={stockInput}
          setStockInput={setStockInput} 
          disabled={false}
          placeholder="Vul een dikte in"
        />
        <ProductItem
          input="number"
          value={product?.price_per_square_meter} 
          label={"Prijs per m²"}
          db_key={"PricePerSquareMeter"}
          stockInput={stockInput}
          setStockInput={setStockInput} 
          disabled={false}
          placeholder="Vul prijs per m² in"
        />
        <ProductItem
          input="text"
          value={product?._id} 
          label={"Artikelnr"}
          db_key={"Artikelnr"}
          stockInput={stockInput}
          setStockInput={setStockInput}
          disabled={true}
          placeholder="Product id"
        />
        <ProductItem
          input="number"
          value={product?.available}
          label={"Beschikbaar"}
          db_key={"Beschikbaar"}
          unit={product?.unit}
          stockInput={stockInput}
          setStockInput={setStockInput}
          disabled={false}
          placeholder="Vul aantal beschikbare meters in"
        />
        <div className="form-row">
          <label htmlFor="afgewerkt_formaat">Afgewerkt formaat</label>
          <select
            id="afgewerkt_formaat"
            value={stockInput.AfgewerktFormaat}
            onChange={(e) => setStockInput({ ...stockInput, AfgewerktFormaat: e.target.value })}
          >
            <option value="">-</option>
            <option value="Ja">Ja</option>
            <option value="Nee">Nee</option>
          </select>
        </div>
      </div>
      <div className="btn-wrapper">
        <button className="btn" onClick={updateToMongo}>
          Bewaar
        </button>
        <button className="btn" onClick={removeFromMongo}>
          Verwijder
        </button>
      </div>
    </main>
  );
}

export async function getServerSideProps({ query }) {
  try {
    const client = await clientPromise;
    const db = client.db("borden");

    let objectId;
    try {
      objectId = ObjectId.createFromHexString(query.slug)
    } catch (error) {
      console.error("Invalid ObjectId:", error);
      return { props: { product: null } };
    }

    let document = await db?.collection(query.cat).findOne(objectId);
    
    return {
      props: { product: JSON.parse(JSON.stringify(document)) },
    };
  } catch (e) {
    console.error('Error in getServerSideProps (product/borden/[slug]):', e);
    // Return null product to prevent crashes
    return { props: { product: null } };
  }
}
