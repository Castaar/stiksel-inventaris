import { useRouter } from "next/router";

import styles from "../../styles/blocks/_product-item.module.scss";

const productItem = (props) => {
  const router = useRouter();
  // let stock = props.stockInput
  let label = props.label

  return (
    <div className={styles["product"]}>
      <label>{props.label}:</label>
      <input
        className={styles["product-item"]}
        placeholder="Search"
        defaultValue={props.value + " " + (props.unit ? props.unit : "")}
        onChange={(e) =>
          props.setStockInput((stock) => ({
            ...stock,
            [label]: e.target.value,
          }))
        }
      />
    </div>
  );
};
export default productItem;
