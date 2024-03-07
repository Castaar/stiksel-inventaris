import { useRouter } from "next/router";

import styles from "../../styles/blocks/_product.module.scss";

const product = (props) => {
  const router = useRouter();

  function cmToMeters(cm) {
    return cm / 100;
  }

  function containsNumbers(value) {
    return /\d/.test(value);
  }

  let available = "";
  if (containsNumbers(props.available)) {
    available = (
      <p className={styles["product-title"]}>{cmToMeters(props.available)}</p>
    );
  } else {
    available = <p className={styles["product-title"]}>{props.available}</p>;
  }

  return (
    <div className={styles["product"]}>
      <p className={styles["product-title"]}>{props.name}</p>
      <p className={styles["product-title"]}>{props.format}</p>
      <p className={styles["product-title"]}>{props.number}</p>
      {available}
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
