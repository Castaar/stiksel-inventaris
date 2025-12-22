'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCollectionDefaults, getCollectionItemNames } from '../../lib/collection-defaults';

import styles from "../../styles/blocks/_product-add.module.scss";

export default function Dropdowns({ collections, products, toast, selectedOption }) {
  const router = useRouter();

  const [selectedCollection, setSelectedCollection] = useState(router.query.collection || selectedOption || 'Selecteer');
  const [selectedProduct, setSelectedProduct] = useState(router.query.state || 'Selecteer');
  const [stockInput, setStockInput] = useState({});
  const [availableItems, setAvailableItems] = useState([]);

  // Defensive checks for props
  const safeCollections = Array.isArray(collections) ? collections : [];
  const safeProducts = Array.isArray(products) ? products : [];

  // Set default price when collection changes and user selects "new product"
  useEffect(() => {
    if (selectedCollection !== 'Selecteer' && selectedProduct === 'new') {
      const defaults = getCollectionDefaults(selectedCollection);
      const itemNames = getCollectionItemNames(selectedCollection);
      setAvailableItems(itemNames);
      setStockInput(prev => ({
        ...prev,
        price: defaults.price_per_piece || defaults.price_per_meter || 0,
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
      data = {
        state: true,
        name: stockInput.name,
        format: stockInput.format ? stockInput.format : '',
        price: Number(stockInput.price) || 0,
        unit: stockInput.unit || '',
        available: Number(stockInput.available) || 0,
        width_cm: Number(stockInput.width_cm) || 0,
        height_cm: Number(stockInput.height_cm) || 0,
      };
    } else {
      const productOld = safeProducts.find(product => product._id === selectedProduct);
      if (!productOld) {
        console.error('Product not found');
        return;
      }

      data = {
        state: false,
        _id: productOld._id,
        name: productOld.name,
        format: productOld.format,
        price: productOld.price,
        unit: productOld.unit,
        available: Number(stockInput.available) || 0,
      };
    }

    try {
      await fetch(
        `/api/add-stock?collection=${selectedCollection}`,
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
          router.push(`/products/stock/${selectedCollection}`);
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
            {safeCollections.map((collection, index) => (
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
              {safeProducts.map((product, index) => (
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
                  <label className={styles["label"]}>Omschrijving</label>
                  <input
                    className={styles["category-search"]}
                    placeholder="Omschrijving"
                    required
                    list="item-names"
                    value={stockInput.name || ''}
                    onChange={(e) => {
                      const newName = e.target.value;
                      const defaults = getCollectionDefaults(selectedCollection, null, newName);
                      
                      setStockInput((prev) => ({
                        ...prev,
                        name: newName,
                        // Update price if found in defaults
                        price: defaults.price_per_piece || defaults.price_per_meter || prev.price || 0,
                      }));
                    }}
                  />
                  <datalist id="item-names">
                    {availableItems.map((itemName, index) => (
                      <option key={index} value={itemName} />
                    ))}
                  </datalist>
                </div>
                <div className={styles["category"]}>
                  <label className={styles["label"]}>Formaat m</label>
                  <input
                    className={styles["category-search"]}
                    placeholder="Formaat m"
                    required
                    onChange={(e) =>
                      setStockInput((prev) => ({
                        ...prev,
                        format: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className={styles["category"]}>
                  <label className={styles["label"]}>Eenheid</label>
                  <select
                    className={styles["category-search"]}
                    value={stockInput.unit || ''}
                    onChange={(e) => {
                      setStockInput((prev) => ({
                        ...prev,
                        unit: e.target.value,
                      }));
                    }}
                  >
                    <option value="">eenheid</option>
                    <option value="stuks">stuks</option>
                    <option value="m">m</option>
                  </select>
                </div>
                {/* {stockInput.unit === 'stuks' && (
                  <>
                    <div className={styles["category"]}>
                      <label className={styles["label"]}>Breedte (cm)</label>
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
                      <label className={styles["label"]}>Hoogte (cm)</label>
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
                  </>
                )} */}
                <div className={styles["category"]}>
                  <label className={styles["label"]}>Prijs</label>
                  <input
                    className={styles["category-search"]}
                    placeholder="Prijs"
                    type="number"
                    value={stockInput.price || ''}
                    onChange={(e) =>
                      setStockInput((prev) => ({
                        ...prev,
                        price: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className={styles["category"]}>
                  <label className={styles["label"]}>Aantal m / stuks</label>
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
          ) : (
            <>
              <div className="main-list-stock">
                <div className={styles["category"]}>
                  <label className={styles["label"]}>Aantal m / stuks</label>
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
