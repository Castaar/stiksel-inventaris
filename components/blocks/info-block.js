import styles from "../../styles/blocks/_info-block.module.scss";

const infoBlock = (props) => {
  return (
    <div className={styles["info"]}>
      <p className={styles["info-value"]}>{props.value}</p>
      <p className={styles["info-title"]}>{props.title}</p>
    </div>
  );
};
export default infoBlock;
