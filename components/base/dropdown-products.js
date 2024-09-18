'use client';

import React from 'react';

import styles from "../../styles/blocks/_category-title.module.scss";

const DropdownProducts = ({ products, selectedProduct, onProductChange }) => {
  const handleChange = (e) => {
    const selectedValue = e.target.value;
    onProductChange(selectedValue);
  };

  return (
    <div className={styles["category"]}>
      <select
        name="product"
        id="product"
        className={styles["category-search"]}
        onChange={handleChange}
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
  );
};

export default DropdownProducts;