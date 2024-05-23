import { useRouter } from "next/router";

import styles from "../../styles/blocks/_product-item.module.scss";

const productItemEdit = (props) => {
  const router = useRouter();

  return (
    <div className={styles["product"]}>
      <input className={styles["product-item"]} placeholder="Search" />
    </div>
  );
};
export default productItemEdit;
