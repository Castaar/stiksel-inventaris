import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { toast } from 'react-hot-toast';
import clientPromise from "../lib/mongodb";
import InfoBlock from "../components/blocks/info-block";

export default function Home(props) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [files, setFiles] = useState([]);
  
  // Defensive checks for props
  const stockTotal = props?.stock?.price?.total ?? 0;
  const bordenTotal = props?.borden?.price?.total ?? 0;

  // Format numbers to 2 decimal places
  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };

  const exportDatabase = async () => {
    setIsExporting(true);
    setFiles([]); // reset files array on each export attempt

    try {
      // Use relative URL for API calls - Next.js handles this correctly
      const response = await fetch('/api/export', {
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

  const importDatabase = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Prompt for password
    const password = prompt('Voer het wachtwoord in om de import te starten:');
    if (!password) {
      event.target.value = ''; // Reset file input
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('Incorrect password');
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      toast.success(`Import successful! Updated ${data.updatedCount} records.`);
      
      // Reset file input
      event.target.value = '';
      
      // Reload page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.log(error);
      toast.error(error.message || "Import failed");
    } finally {
      setIsImporting(false);
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
          value={`€ ${formatPrice(stockTotal)}`}
          title={"Waarde totale stock"}
        />
        <div className="mt-40">
          <InfoBlock
            value={`€ ${formatPrice(bordenTotal)}`}
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

        <div className="mt-20">
          {isImporting ? (
            <span>importing...</span>
          ) : (
            <label className="btn-secondary download" style={{ cursor: 'pointer' }}>
              Import
              <input
                type="file"
                accept=".xlsx"
                onChange={importDatabase}
                style={{ display: 'none' }}
              />
            </label>
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
    console.log('[Index] Starting getServerSideProps...');
    
    const totalPriceStock = await calculateTotalPriceForDB('stock');
    console.log('[Index] Stock total price:', totalPriceStock);
    
    const totalPriceBorden = await calculateTotalPriceForDB('borden');
    console.log('[Index] Borden total price:', totalPriceBorden);

    const result = {
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
    
    console.log('[Index] Returning props:', JSON.stringify(result.props));
    return result;
  } catch (e) {
    console.error('[Index] Error in getServerSideProps:', e.message);
    console.error('[Index] Full error:', e);
    // Return default structure to prevent crashes
    return {
      props: {
        stock: {
          price: {
            total: 0
          }
        },
        borden: {
          price: {
            total: 0
          }
        }
      },
    };
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
        // Calculate price based on calculation_type for accurate totals
        let itemPrice = 0;

        if (doc.calculation_type) {
          // Calculate price dynamically based on type
          switch (doc.calculation_type) {
            case 'bord':
              itemPrice = (doc.available || 0) * 
                         ((doc.width_cm || 0) * (doc.height_cm || 0) / 10000) * 
                         (doc.price_per_square_meter || 0);
              break;
            case 'stuk':
              itemPrice = (doc.available || 0) * (doc.price_per_piece || 0);
              break;
            case 'rol_per_meter':
              itemPrice = (doc.available || 0) * (doc.price_per_meter || 0);
              break;
            case 'rol_per_square_meter':
              itemPrice = (doc.available || 0) * 
                         ((doc.width_cm || 0) / 100) * 
                         (doc.price_per_square_meter || 0);
              break;
            case 'total_rol_per_meter':
              if (doc.total_meter_per_rol && doc.total_meter_per_rol > 0) {
                itemPrice = ((doc.price_per_rol || 0) / doc.total_meter_per_rol) * 
                           (doc.available || 0);
              }
              break;
            default:
              itemPrice = doc.price || 0;
          }
        } else {
          // Fallback to stored price field if no calculation_type
          itemPrice = doc.price || 0;
        }

        return sum + (isNaN(itemPrice) ? 0 : itemPrice);
      }, 0);

      totalPrice += collectionPrice;
    }

    return totalPrice;
  } catch (error) {
    console.error(`Error calculating total price for database ${dbName}:`, error);
    return 0;
  }
}
