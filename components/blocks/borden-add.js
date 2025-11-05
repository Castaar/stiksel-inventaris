'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCollectionDefaults } from '../../lib/collection-defaults';

import styles from "../../styles/blocks/_product-add.module.scss";

export default function Dropdowns({ collections, products, toast, selectedOption }) {
  const router = useRouter();

  const [selectedCollection, setSelectedCollection] = useState(router.query.collection || selectedOption || 'Selecteer');
  const [selectedProduct, setSelectedProduct] = useState(router.query.state || 'Selecteer');
  const [stockInput, setStockInput] = useState({});

  // Set default price when collection changes and user selects "new product"
  useEffect(() => {
    if (selectedCollection !== 'Selecteer' && selectedProduct === 'new') {
      const defaults = getCollectionDefaults(selectedCollection);
      setStockInput(prev => ({
        ...prev,
        price_per_square_meter: defaults.price_per_square_meter,
        calculation_type: defaults.calculation_type
      }));
    }
  }, [selectedCollection, selectedProduct]);

  const handleCollectionChange = (newCollection) => {
    setSelectedCollection(newCollection);
    setSelectedProduct('Selecteer');
    router.push({
      pathname: router.pathname,
      query: { collection: newCollection },
    });
    setStockInput({});
  };

  const handleProductChange = (newProduct) => {
    setSelectedProduct(newProduct);
    router.push({
      pathname: router.pathname,
      query: { collection: selectedCollection, state: newProduct },
    });
    setStockInput({});
  };

  const saveToMongo = async () => {
    const isNewProduct = selectedProduct === 'new';
    let data = {};

    if (isNewProduct) {
      // Validation for new products
      if (!stockInput.name) {
        toast.error('Naam is verplicht');
        return;
      }
      if (!stockInput.available || Number(stockInput.available) <= 0) {
        toast.error('Aantal stuks is verplicht');
        return;
      }
      if (!stockInput.price_per_square_meter || Number(stockInput.price_per_square_meter) <= 0) {
        toast.error('Prijs per m² is verplicht');
        return;
      }

      data = {
        name: stockInput.name,
        thickness: stockInput.thickness || 0,
        unit: stockInput.unit || 'stuks',
        available: Number(stockInput.available) || 0,
        calculation_type: stockInput.calculation_type || 'bord',
        width_cm: Number(stockInput.width_cm) || 0,
        height_cm: Number(stockInput.height_cm) || 0,
        price_per_square_meter: Number(stockInput.price_per_square_meter) || 0,
        price_per_piece: Number(stockInput.price_per_piece) || 0,
      };
    } else {
      const productOld = products.find(product => product._id === selectedProduct);
      if (!productOld) {
        console.error('Product not found');
        return;
      }

      if (!stockInput.available || Number(stockInput.available) <= 0) {
        toast.error('Aantal stuks is verplicht');
        return;
      }

      data = {
        _id: productOld._id,
        name: productOld.name,
        thickness: productOld.thickness,
        unit: productOld.unit,
        available: Number(stockInput.available) || 0,
        calculation_type: productOld.calculation_type,
        width_cm: productOld.width_cm,
        height_cm: productOld.height_cm,
        price_per_square_meter: productOld.price_per_square_meter,
        price_per_piece: productOld.price_per_piece,
      };
    }

    try {
      await fetch(
        `/api/add-borden?collection=${selectedCollection}`,
        {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
          },
        }
      ).then((response) => {
        if (response.ok) {
          toast.success(`Stock is aangevuld`);
          router.push(`/products/borden/${selectedCollection}`);
        } else {
          console.error('Failed to save data');
          toast.error(`'t Spel es kapot`);
        }
      });
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error(`'t Spel es kapot`);
    }
  };

  return (
    <>
      <div className="main-heading">
        <div className={styles["category"]}>
          <select
            name="collection"
            id="collection"
            className={styles["category-search"]}
            onChange={(e) => handleCollectionChange(e.target.value)}
            value={selectedCollection} // This will set the selected option
          >
            <option value="Selecteer">Selecteer</option>
            {collections.map((collection, index) => (
              <option key={index} value={collection.name}>
                {collection.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCollection !== 'Selecteer' && (
          <div className={styles["category"]}>
            <select
              name="product"
              id="product"
              className={styles["category-search"]}
              onChange={(e) => handleProductChange(e.target.value)}
              value={selectedProduct}
            >
              <option value="Selecteer">Selecteer</option>
              {products.map((product, index) => (
                <option key={index} value={product._id}>
                  {product.name}
                </option>
              ))}
              <option value="new">Nieuw product</option>
            </select>
          </div>
        )}
      </div>

      {selectedCollection !== 'Selecteer' && selectedProduct !== 'Selecteer' && (
        <>
          {selectedProduct === 'new' ? (
            <>
              <div className="main-list-stock">
                <div className={styles["category"]}>
                  <input
                    className={styles["category-search"]}
                    placeholder="Naam (bijv. 38 x 35)"
                    required
                    onChange={(e) => {
                      const value = e.target.value;
                      // Try to parse dimensions from name - support comma and dot as decimal separator
                      const match = value.match(/(\d+[,.]?\d*)\s*[xX×]\s*(\d+[,.]?\d*)/);
                      
                      setStockInput((prev) => ({
                        ...prev,
                        name: value,
                        width_cm: match ? parseFloat(match[1].replace(',', '.')) : prev.width_cm,
                        height_cm: match ? parseFloat(match[2].replace(',', '.')) : prev.height_cm,
                      }));
                    }}
                  />
                </div>
                <div className={styles["category"]}>
                  <input
                    className={styles["category-search"]}
                    placeholder="Dikte (mm)"
                    type="number"
                    onChange={(e) =>
                      setStockInput((prev) => ({
                        ...prev,
                        thickness: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className={styles["category"]}>
                  <input
                    className={styles["category-search"]}
                    placeholder="Breedte (cm)"
                    type="number"
                    value={stockInput.width_cm || ''}
                    onChange={(e) =>
                      setStockInput((prev) => ({
                        ...prev,
                        width_cm: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className={styles["category"]}>
                  <input
                    className={styles["category-search"]}
                    placeholder="Hoogte (cm)"
                    type="number"
                    value={stockInput.height_cm || ''}
                    onChange={(e) =>
                      setStockInput((prev) => ({
                        ...prev,
                        height_cm: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className={styles["category"]}>
                  <select
                    className={styles["category-search"]}
                    onChange={(e) => {
                      setStockInput((prev) => ({
                        ...prev,
                        unit: e.target.value,
                      }));
                    }}
                    defaultValue="stuks"
                  >
                    <option value="stuks">stuks</option>
                    <option value="m">m</option>
                  </select>
                </div>
                <div className={styles["category"]}>
                  <select
                    className={styles["category-search"]}
                    onChange={(e) => {
                      setStockInput((prev) => ({
                        ...prev,
                        calculation_type: e.target.value,
                      }));
                    }}
                    defaultValue="bord"
                  >
                    <option value="bord">Bord (per m²)</option>
                    <option value="stuk">Per stuk</option>
                  </select>
                </div>
                <div className={styles["category"]}>
                  <input
                    className={styles["category-search"]}
                    placeholder="Prijs per m² *"
                    type="number"
                    step="0.01"
                    required
                    value={stockInput.price_per_square_meter || ''}
                    onChange={(e) =>
                      setStockInput((prev) => ({
                        ...prev,
                        price_per_square_meter: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className={styles["category"]}>
                  <input
                    className={styles["category-search"]}
                    placeholder="Prijs per stuk"
                    type="number"
                    step="0.01"
                    onChange={(e) =>
                      setStockInput((prev) => ({
                        ...prev,
                        price_per_piece: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className={styles["category"]}>
                  <input
                    className={styles["category-search"]}
                    placeholder="Aantal stuks"
                    type="number"
                    required
                    onChange={(e) =>
                      setStockInput((prev) => ({
                        ...prev,
                        available: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
              <div className="btn-wrapper">
                <button className="btn" onClick={saveToMongo}>
                  Bewaar
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="main-list-stock">
                <div className={styles["category"]}>
                  <input
                    className={styles["category-search"]}
                    placeholder="Aantal m / stuks"
                    type="number"
                    required
                    onChange={(e) =>
                      setStockInput((prev) => ({
                        ...prev,
                        available: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
              <div className="btn-wrapper">
                <button className="btn" onClick={saveToMongo}>
                  Bewaar
                </button>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
