import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { toast } from 'react-hot-toast';
import clientPromise from "../lib/mongodb";
import InfoBlock from "../components/blocks/info-block";

export default function Home(props) {
  const [isExporting, setIsExporting] = useState(false);
  const [files, setFiles] = useState([]);

  const exportDatabase = async () => {
    setIsExporting(true);
    setFiles([]); // reset files array on each export attempt

    try {
      const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
      const apiUrl = `${protocol}://${process.env.NEXT_PUBLIC_API}/api/export`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json, text/plain, */*",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const returnedFiles = data.files;

      if (!returnedFiles) {
        throw new Error("Files not found in the response.");
      }

      setFiles(returnedFiles);

      toast.success("Export successful!");
    } catch (error) {
      console.log(error);
      toast.error("'t Spel es kapot");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Home | Castaar Inventaris</title>
        <meta name="description" content="Castaar stock inventaris" />
        <link rel="icon" href="/images/favicon.svg" />
      </Head>
      <main className="main main-overview">
        <div className="d-flex justify-content-space-between flex-wrap w-100 btn-menu">
          <Link href="/stock">Stock</Link>
          <Link href="/borden">Borden</Link>
        </div>
        <InfoBlock
          value={`€ ${props.stock.price.total}`}
          title={"Waarde totale stock"}
        />
        <div className="mt-40">
          <InfoBlock
            value={`€ ${props.borden.price.total}`}
            title={"Waarde totale borden"}
          />
        </div>
        <div className="mt-40">
          {isExporting ? (
            <span>exporting...</span>
          ) : (
            <button className="btn-secondary download" onClick={exportDatabase}>
              Export
            </button>
          )}
        </div>

        {/* If there are files after a successful export, show download buttons */}
        {files && files.length > 0 && (
          <div className="mt-20">
            {files.map((file, index) => (
              <a
                key={index}
                href={file.url}
                download
                className="btn-secondary download mr-10"
              >
                {file.filename}
              </a>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export async function getServerSideProps({ query }) {
  try {
    const totalPriceStock = await calculateTotalPriceForDB('stock');
    const totalPriceBorden = await calculateTotalPriceForDB('borden');

    return {
      props: {
        stock: {
          price: {
            total: totalPriceStock
          }
        },
        borden: {
          price: {
            total: totalPriceBorden
          }
        }
      },
    };
  } catch (e) {
    return { props: { error: JSON.parse(JSON.stringify(e)) } };
  }
}

async function calculateTotalPriceForDB(dbName) {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();

    let totalPrice = 0;

    for (const collection of collections) {
      const collectionName = collection.name;
      const coll = db.collection(collectionName);

      const documents = await coll.find({}).toArray();

      const collectionPrice = documents.reduce((sum, doc) => {
        if (doc.price && !isNaN(doc.price)) {
          return sum + doc.price;
        }
        return sum;
      }, 0);

      totalPrice += collectionPrice;
    }

    return totalPrice;
  } catch (error) {
    console.error(`Error calculating total price for database ${dbName}:`, error);
    return 1000000;
  }
}
