import { useRouter } from "next/router";

import styles from "../../styles/blocks/_category-title.module.scss";

const dropdownProducts = (props) => {
  const router = useRouter();

  return (
    <div className={styles["category"]}>
      <select
        name="data"
        id="data"
        className={styles["category-search"]}
        onChange={(e) => {
          const selectedOption = e.target.options[e.target.selectedIndex];
          router.replace(
            `/${router.pathname}?collection=${
              router.query.collection
            }&state=${selectedOption.getAttribute("name")}`
          );
          props.setStockInput((stockInput) => ({
            ...stockInput,
            _id: selectedOption.value,
            name: selectedOption.getAttribute("name"),
          }));
        }}
        defaultValue={router.query?.state}
      >
        <option defaultChecked>Selecteer</option>
        {props.collections.map((collection, index) => {
          return (
            <option key={index} value={collection._id} name={collection.name}>
              {collection.name}
            </option>
          );
        })}
        {router.pathname === "/stock-aanvullen" && (
          <option value="new" name="new">
            Nieuw product
          </option>
        )}
      </select>
    </div>
  );
};
export default dropdownProducts;
