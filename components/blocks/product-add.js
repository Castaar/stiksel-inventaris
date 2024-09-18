// components/blocks/Dropdowns.js
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';

import styles from "../../styles/blocks/_product-add.module.scss";

export default function Dropdowns({ collections, products, db_name, toast, slug }) {
  const router = useRouter();

  const [selectedCollection, setSelectedCollection] = useState(router.query.collection || 'Selecteer');
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
        format: stockInput.format ? stockInput.format : '',
        price: stockInput.price || 0,
        unit: stockInput.unit || '',
        available: stockInput.available || 0
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
        format: productOld.format,
        price: productOld.price,
        unit: productOld.unit,
        available: stockInput.available || 0,
      };
    }

    try {
      console.log(data)
      await fetch(
        `/api/add-${db_name}?collection=${selectedCollection}`,
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
          router.push(`/products/${db_name}/${selectedCollection}`);
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
            value={selectedCollection}
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
                  placeholder={db_name === "stock" ? "Formaat cm" : db_name === "borden" ? "Dikte cm" : "Formaat"}
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