import { useRouter } from "next/router";

import styles from "../../styles/blocks/_product-item.module.scss";

const productItem = (props) => {
  const router = useRouter();
  // let stock = props.stockInput
  let label = props.label

  return (
    <div className={styles["product"]}>
      <label>{props.label} {`${props.unit ? "(M)" : ""}`}:</label>
      <input
        type={props.input}
        className={styles["product-item"]}
        placeholder="Search"
        defaultValue={props.value}
        onChange={(e) =>
          props.setStockInput((stock) => ({
            ...stock,
            [label]: e.target.value,
          }))
        }
        disabled={props.disabled}
      />
    </div>
  );
};
export default productItem;
