'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';

import styles from "../../styles/blocks/_product-add.module.scss";

export default function Dropdowns({ collections, products, toast, selectedOption }) {
  const router = useRouter();

  const [selectedCollection, setSelectedCollection] = useState(router.query.collection || selectedOption || 'Selecteer');
  const [selectedProduct, setSelectedProduct] = useState(router.query.state || 'Selecteer');
  const [stockInput, setStockInput] = useState({});

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
        thickness: stockInput.thickness ? stockInput.thickness : '',
        price: stockInput.price || 0,
        unit: stockInput.unit || '',
        available: Number(stockInput.available) || 0,
      };
    } else {
      const productOld = products.find(product => product._id === selectedProduct);
      if (!productOld) {
        console.error('Product not found');
        return;
      }

      data = {
        state: false,
        _id: productOld._id,
        name: productOld.name,
        thickness: productOld.thickness,
        price: productOld.price,
        unit: productOld.unit,
        available: Number(stockInput.available) || 0,
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
              <option key={index} value={collection.name} selected={collection.name === selectedOption}>
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
                    placeholder="Omschrijving"
                    required
                    onChange={(e) =>
                      setStockInput((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className={styles["category"]}>
                  <input
                    className={styles["category-search"]}
                    placeholder="Dikte cm"
                    required
                    onChange={(e) =>
                      setStockInput((prev) => ({
                        ...prev,
                        thickness: e.target.value,
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
                  >
                    <option value="">eenheid</option>
                    <option value="stuks">stuks</option>
                    <option value="m">m</option>
                  </select>
                </div>
                <div className={styles["category"]}>
                  <input
                    className={styles["category-search"]}
                    placeholder="Prijs"
                    type="number"
                    onChange={(e) =>
                      setStockInput((prev) => ({
                        ...prev,
                        price: Number(e.target.value),
                      }))
                    }
                  />
                </div>
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
