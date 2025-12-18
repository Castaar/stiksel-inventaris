import { useRouter } from "next/router";

import styles from "../../styles/blocks/_product.module.scss";

const product = (props) => {
  const router = useRouter();

  return (
    <div className={styles["product"]}>
      <p className={styles["product-title"]}>{ props?.name }</p>
      <p className={styles["product-title"]}>{ props.available }</p>
      <p className={styles["product-title"]}>{ props?.format }
        {
          props.slug !== 'stock' && props.thickness && 
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
