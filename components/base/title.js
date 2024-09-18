import { useRouter } from "next/router";

import styles from "../../styles/base/_title.module.scss";

const title = (props) => {
  const router = useRouter();

  return (
    <div className={styles["title"]}>
      {/* <a onClick={() => router.push(props.url)}>Terug</a> */}
      {/* <a onClick={() => router.back()}>Terug</a> */}
      <h1 className={styles["title-value"]}>{props.value}.</h1>
    </div>
  );
};
export default title;
