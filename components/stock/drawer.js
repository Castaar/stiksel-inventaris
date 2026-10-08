import { useEffect, useRef } from "react";

import styles from "../../styles/stock/_drawer.module.scss";

// Side panel; `contentKey` changes when other content is shown, to move the focus again
export default function Drawer({ open, onClose, contentKey, children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !ref.current) return;
    const timer = setTimeout(() => {
      const target = ref.current?.querySelector("[data-autofocus]") || ref.current?.querySelector("[data-close]");
      target?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, [open, contentKey]);

  return (
    <>
      <div className={`${styles["scrim"]} ${open ? styles["open"] : ""}`} onClick={onClose} />
      <aside
        ref={ref}
        className={`${styles["drawer"]} ${open ? styles["open"] : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        aria-hidden={!open}
        inert={!open}
      >
        {children}
      </aside>
    </>
  );
}

export function DrawerHead({ kicker, title, onClose }) {
  return (
    <div className={styles["head"]}>
      <div>
        <div className={styles["kicker"]}>{kicker}</div>
        <h2 id="drawer-title">{title}</h2>
      </div>
      <button type="button" className="iconbtn" data-close onClick={onClose} aria-label="Sluiten">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}

export function DrawerBody({ children, as: Tag = "div", ...rest }) {
  return (
    <Tag className={styles["body"]} {...rest}>
      {children}
    </Tag>
  );
}

export function DrawerFoot({ left, children }) {
  return (
    <div className={styles["foot"]}>
      {left || <span />}
      <div className={styles["foot-actions"]}>{children}</div>
    </div>
  );
}
