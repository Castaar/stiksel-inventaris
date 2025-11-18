import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { toast } from 'react-hot-toast';
import clientPromise from "../lib/mongodb";
import InfoBlock from "../components/blocks/info-block";

export default function Home(props) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  // Defensive checks for props
  const stockTotal = props?.stock?.price?.total ?? 0;
  const bordenTotal = props?.borden?.price?.total ?? 0;

  // Format numbers to 2 decimal places
  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };

  const exportDatabase = async () => {
    setIsExporting(true);

    try {
      // Use relative URL for API calls - Next.js handles this correctly
      const response = await fetch('/api/export', {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'export-complete.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export successful!");
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Export failed: ${error.message}`);
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

  const clearDatabase = async () => {
    // Double confirmation
    const confirmFirst = confirm('⚠️ WAARSCHUWING: Dit zal ALLE data uit de database verwijderen maar de collecties behouden. Weet je het zeker?');
    if (!confirmFirst) return;

    const confirmSecond = confirm('Ben je echt 100% zeker? Deze actie kan NIET ongedaan gemaakt worden!');
    if (!confirmSecond) return;

    // Prompt for password
    const password = prompt('Voer het wachtwoord in om de database te legen:');
    if (!password) return;

    setIsClearing(true);

    try {
      const response = await fetch('/api/clear-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('Incorrect password');
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      toast.success(`Database cleared! Deleted ${data.totalDeleted} documents.`);
      
      // Reload page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Clear database error:', error);
      toast.error(error.message || "Clear failed");
    } finally {
      setIsClearing(false);
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

        <div className="mt-20">
          {isClearing ? (
            <span>clearing database...</span>
          ) : (
            <button className="btn-secondary download" onClick={clearDatabase} style={{ backgroundColor: '#d32f2f' }}>
              Clear Database
            </button>
          )}
        </div>

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
        let itemPrice = 0;

        // First try to use the stored price field
        if (doc.price && !isNaN(doc.price) && doc.price > 0) {
          itemPrice = doc.price;
        } 
        // If no price or price is 0, try to calculate based on calculation_type
        else if (doc.calculation_type) {
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
              itemPrice = 0;
          }
        }

        return sum + (isNaN(itemPrice) ? 0 : itemPrice);
      }, 0);

      totalPrice += collectionPrice;
    }

    console.log(`[calculateTotalPriceForDB] ${dbName} total:`, totalPrice);
    return totalPrice;
  } catch (error) {
    console.error(`Error calculating total price for database ${dbName}:`, error);
    return 0;
  }
}
