import { useRouter } from "next/router";

import styles from "../../styles/blocks/_product-item.module.scss";

const productItem = (props) => {
  const router = useRouter();

  return (
    <div className={styles["product"]}>
      <input
        className={styles["product-item"]}
        placeholder="Search"
        defaultValue={props.value}
      />
    </div>
  );
};
export default productItem;
