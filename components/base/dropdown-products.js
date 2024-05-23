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
        onChange={(e) =>
          router.replace(
            `/${router.pathname}?collection=${router.query.collection}&state=${e.target.value}`
          )
        }
        defaultValue={router.query?.state}
      >
        <option defaultChecked>Selecteer</option>
        {props.collections.map((collection, index) => {
          return (
            <option key={index} value={collection.name}>
              {collection.name}
            </option>
          );
        })}
        {router.pathname === "/stock-aanvullen" && (
          <option value="new">Nieuw product</option>
        )}
      </select>
    </div>
  );
};
export default dropdownProducts;
