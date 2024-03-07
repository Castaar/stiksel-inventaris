import { useRouter } from "next/router";

import styles from "../../styles/blocks/_category.module.scss";

const category = (props) => {
  const router = useRouter();

  return (
    <div
      className={styles["category"]}
      onClick={() => router.push(`/products/${props.title}`)}
    >
      <p className={styles["category-title"]}>{props.title}</p>
    </div>
  );
};
export default category;
