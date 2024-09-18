'use client';

import React from 'react';

import styles from "../../styles/blocks/_category-title.module.scss";

const Dropdown = ({ collections, selectedCollection, onCollectionChange }) => {
  const handleChange = (e) => {
    const selectedValue = e.target.value;
    onCollectionChange(selectedValue);
  };

  return (
    <div className={styles["category"]}>
      <select
        name="collection"
        id="collection"
        className={styles["category-search"]}
        onChange={handleChange}
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
  );
};

export default Dropdown;
