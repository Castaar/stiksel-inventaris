import { useRouter } from "next/router";

import styles from "../../styles/blocks/_category-title.module.scss";

const search = (props) => {
  const router = useRouter();

  return (
    <div className={styles["category"]}>
      <select
        name="cars"
        id="cars"
        className={styles["category-search"]}
        onChange={(e) =>
          router.replace(`/order-plaatsen?collection=${e.target.value}`)
        }
      >
        {props.collections.map((collection, index) => {
          return (
            <option key={index} value={collection.name}>
              {collection.name}
            </option>
          );
        })}
      </select>
    </div>
  );
};
export default search;
