import { useRouter } from "next/router";

import styles from "../../styles/blocks/_category-title.module.scss";

const categoryTitle = ({ title }) => {
  const router = useRouter();

  return (
    <div className={styles["category"]}>
      <p className={styles["category-title"]}>
        {title ? title : router.query.slug}
      </p>
    </div>
  );
};
export default categoryTitle;
