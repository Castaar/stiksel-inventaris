import { useRouter } from "next/router";

import styles from "../../styles/blocks/_product.module.scss";

const product = (props) => {
  const router = useRouter();

  function cmToMeters(cm) {
    return cm / 100;
  }

  return (
    <div className={styles["product"]}>
      <p className={styles["product-title"]}>
        <span className={styles["product-label"]}>Naam: </span>
        {props.name}
      </p>
      <p className={styles["product-title"]}>
        <span className={styles["product-label"]}>Formaat: </span>
        {props.format}
      </p>
      <p className={styles["product-title"]}>
        <span className={styles["product-label"]}>Artikelnr: </span>
        {props.number}
      </p>
      <p className={styles["product-title"]}>
        <span className={styles["product-label"]}>Voorraad: </span>
        {typeof props.available === "number"
          ? cmToMeters(props.available)
          : props.available}
      </p>
      {props.edit && (
        <a
          className={styles["product-link"]}
          onClick={() =>
            router.push(`/product/${props.number}?cat=${router.query.slug}`)
          }
        >
          Bewerk
        </a>
      )}
    </div>
  );
};
export default product;
