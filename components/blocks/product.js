import { useRouter } from "next/router";

import styles from "../../styles/blocks/_product.module.scss";

const product = (props) => {
  const router = useRouter();

  const unitCheck = props.unit === "stuks";

  // Format number to 2 decimals if it's a number
  const formatValue = (value) => {
    if (!value) return value;
    const num = parseFloat(value.toString().replace(',', '.'));
    if (!isNaN(num)) {
      // Format to 2 decimals and remove trailing zeros
      const formatted = num.toFixed(2).replace(/\.?0+$/, '');
      return formatted.replace('.', ',');
    }
    return value;
  };

  return (
    <div className={styles["product"]}>
      <p className={styles["product-title"]}>{ props?.name }</p>
      <p className={styles["product-title"]}>{ props.available }</p>
      <p className={styles["product-title"]}>{ formatValue(props?.format) }
        {
          props.thickness && 
          <>
            {props?.thickness}
          </>
        }
      </p>
      <p className={styles["product-title"]}>
        {props.afgewerkt_formaat_header || props.afgewerkt_formaat || '-'}
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
