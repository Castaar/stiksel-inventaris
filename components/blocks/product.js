import { useRouter } from "next/router";

import styles from "../../styles/blocks/_product.module.scss";

const product = (props) => {
  const router = useRouter();

  const unitCheck = props.unit === "stuks";

  return (
    <div className={styles["product"]}>
      <p className={styles["product-title"]}>{ props?.name }</p>
      <p className={styles["product-title"]}>{ props.available }</p>
      <p className={styles["product-title"]}>{ props?.format }
        {
          props.thickness && 
          <>
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
