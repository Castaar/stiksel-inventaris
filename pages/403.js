import Head from "next/head";
import { useRouter } from "next/router";

import Logo from "../components/layout/logo";

import styles from "../styles/layout/_login.module.scss";

export default function Forbidden() {
  const router = useRouter();
  const { ip } = router.query;

  return (
    <>
      <Head>
        <title>Geen toegang - Stiksel Stock</title>
      </Head>
      <main className={styles["gate"]}>
        <div className={styles["card"]}>
          <div className={styles["logo"]}>
            <Logo />
            <small>Stock</small>
          </div>
          <h1 className={styles["title"]}>Geen toegang</h1>
          <p className="hint">
            Dit netwerk heeft geen toegang tot de inventaris. Neem contact op met de beheerder als dit niet klopt.
          </p>
          {ip && <p className="hint">Gedetecteerd IP-adres: {ip}</p>}
        </div>
      </main>
    </>
  );
}
