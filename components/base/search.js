import { useRouter } from "next/router";

import styles from "../../styles/blocks/_category-title.module.scss";

const search = ({ setSearchInput, productSearchInfo }) => {
  const router = useRouter();

  return (
    <div className={styles["category"]}>
      <input
        className={styles["category-search"]}
        placeholder="Search"
        onChange={(e) => setSearchInput(e.target.value)}
        defaultValue={router.query?.product}
      />
    </div>
  );
};
export default search;
