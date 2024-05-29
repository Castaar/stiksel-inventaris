import { useRouter } from "next/router";

import styles from "../../styles/blocks/_product.module.scss";

const selectProduct = (props) => {
  const router = useRouter();

  function cmToMeters(cm) {
    return cm / 100;
  }

  return (
    <div className={styles["product"]}>
      <p className={styles["product-title"]}>{props.name}</p>
      <p className={styles["product-title"]}>{props.format}</p>
      <p className={styles["product-title"]}>{props.number}</p>
      <p className={styles["product-title"]}>
        {typeof props.available === "number"
          ? cmToMeters(props.available)
          : props.available}
      </p>
      {props.edit && (
        <a
          className={styles["product-link"]}
          onClick={() =>
            router.push(
              `/order/?collection=${router.query.collection}&id=${props._id}`
            )
          }
        >
          Selecteer
        </a>
      )}
    </div>
  );
};
export default selectProduct;
