import { useRouter } from "next/router";

import styles from "../../styles/blocks/_product.module.scss";

const product = (props) => {
  const router = useRouter();

  // function cmToMeters(cm) {
  //   return cm / 100;
  // }

  const unitCheck = props.unit === "stuks";

  console.log(props);

  return (
    <div className={styles["product"]}>
      <p className={styles["product-title"]}>
        <span className={styles["product-label"]}>Naam: </span>
        {props?.name}
      </p>
      <p className={styles["product-title"]}>
        <span className={styles["product-label"]}>Voorraad: </span>
        {props.available}
      </p>
      <p className={styles["product-title"]}>
        {
          props.format &&
          <>
            <span className={styles["product-label"]}>Formaat: </span>
            {props?.format}
          </>
        }
        {
          props.thickness && 
          <>
            <span className={styles["product-label"]}>Dikte: </span>
            {props?.thickness}
          </>
        }
      </p>
      {props.edit && (
        <a
          className={styles["product-link"]}
          onClick={() =>
            router.push(`/product/${props.slug}/${props._id}?cat=${router.query.slug}`)
          }
        >
          Bewerk
        </a>
      )}
    </div>
  );
};
export default product;
