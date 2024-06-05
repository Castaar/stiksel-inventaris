import { useRouter } from "next/router";

import styles from "../../styles/blocks/_product-item.module.scss";

const productItem = (props) => {
  const router = useRouter();

  console.log(props);

  return (
    <div className={styles["product"]}>
      <label>{props.label}:</label>
      <input
        className={styles["product-item"]}
        placeholder="Search"
        defaultValue={props.value + " " + (props.unit ? props.unit : "")}
      />
    </div>
  );
};
export default productItem;
