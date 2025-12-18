import { useRouter } from "next/router";

import styles from "../../styles/blocks/_product-item.module.scss";

const productItem = (props) => {
  const router = useRouter();
  let label = props.label

  // Use controlled input with value from stockInput state
  const inputValue = props.stockInput?.[props.db_key] !== undefined 
    ? props.stockInput[props.db_key] 
    : props.value || '';

  return (
    <div className={styles["product"]}>
      <label>{label} {`${props.unit ? "(cm)" : label === "Dikte" ? "(mm)" : ""}`}:</label>
      <input
        type={props.input}
        className={styles["product-item"]}
        placeholder={props.placeholder}
        value={inputValue}
        onChange={(e) =>
          props.setStockInput((stock) => ({
            ...stock,
            [props.db_key]: e.target.value,
          }))
        }
        disabled={props.disabled}
      />
    </div>
  );
};
export default productItem;
