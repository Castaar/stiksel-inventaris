import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import Logo from "./logo";
import { label } from "../../lib/stock-view";

import styles from "../../styles/layout/_header.module.scss";

const THEME_KEY = "stiksel-stock-theme";

function toggleTheme() {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(THEME_KEY, root.dataset.theme);
  } catch {}
}

// Overzicht, one tab per database, Recent. Search and "+ Product" only show on the dashboard
// (when their handlers are passed).
export default function AppHeader({ tab, databases = [], search, onSearch, onSearchSubmit, onAdd, layout, onLayout, menu = [] }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const tabs = [["overzicht", "Overzicht"], ...databases.map((db) => [db, label(db)]), ["recent", "Recent"]];

  // Apply the saved theme (an inline script before paint isn't allowed by the CSP)
  useEffect(() => {
    try {
      const theme = localStorage.getItem(THEME_KEY);
      if (theme) document.documentElement.dataset.theme = theme;
    } catch {}
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
      if (e.key === "/" && !typing && searchRef.current) {
        e.preventDefault();
        searchRef.current.focus();
      }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const items = [
    ...menu,
    { label: "Licht / donker wisselen", onClick: toggleTheme },
    {
      label: "Uitloggen",
      onClick: async () => {
        try {
          await fetch("/api/login", { method: "DELETE" });
        } catch {}
        router.replace("/login");
      },
    },
  ];

  return (
    <header className={styles["top"]}>
      <div className={`wrap ${styles["bar"]}`}>
        <Link href="/" className={styles["logo"]} aria-label="Stiksel Stock, naar het overzicht">
          <Logo />
          <small>Stock</small>
        </Link>
        {tab && (
          <nav className={styles["tabs"]} aria-label="Weergave">
            {tabs.map(([key, title]) => (
              <Link
                key={key}
                href={key === "overzicht" ? "/" : { pathname: "/", query: { tab: key } }}
                shallow
                scroll={false}
                aria-current={tab === key ? "page" : undefined}
              >
                {title}
              </Link>
            ))}
          </nav>
        )}
        <div className={styles["spacer"]} />
        {onSearch && (
          <div className={styles["search"]}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && onSearchSubmit) onSearchSubmit(search);
              }}
              placeholder={onSearchSubmit ? "Zoek of vraag, bv. 20 zwarte hoodies in M" : "Zoek op refnr, model, kleur of maat"}
              aria-label="Zoeken"
              autoComplete="off"
            />
          </div>
        )}
        {onLayout && (
          <div className={`seg ${styles["layout"]}`} role="radiogroup" aria-label="Weergave van de producten">
            <button
              type="button"
              role="radio"
              aria-checked={layout === "tegels"}
              aria-label="Tegels"
              title="Tegels"
              onClick={() => onLayout("tegels")}
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" aria-hidden="true">
                <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
                <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
                <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
                <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
              </svg>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={layout === "rijen"}
              aria-label="Rijen"
              title="Rijen"
              onClick={() => onLayout("rijen")}
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" aria-hidden="true">
                <rect x="4" y="4.5" width="16" height="4" rx="1.5" />
                <rect x="4" y="10" width="16" height="4" rx="1.5" />
                <rect x="4" y="15.5" width="16" height="4" rx="1.5" />
              </svg>
            </button>
          </div>
        )}
        {onAdd && (
          <button type="button" className="btn primary" onClick={onAdd}>
            + Product
          </button>
        )}
        <div className={styles["menu"]} ref={menuRef}>
          <button
            type="button"
            className="iconbtn"
            aria-label="Meer acties"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
          {menuOpen && (
            <div className={styles["menu-pop"]}>
              {items.map((item) =>
                item.href ? (
                  <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      item.onClick();
                    }}
                  >
                    {item.label}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
