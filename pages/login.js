import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import Logo from "../components/layout/logo";

import styles from "../styles/layout/_login.module.scss";

// Only follow links within the app (no "//other-site.com")
function safeNext(next) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Full page load, so the pages are fetched with the new session cookie
        window.location.assign(safeNext(router.query.next));
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Inloggen mislukt");
    } catch {
      setError("Geen verbinding, probeer opnieuw");
    }
    setBusy(false);
  }

  return (
    <>
      <Head>
        <title>Inloggen - Stiksel Stock</title>
      </Head>
      <main className={styles["gate"]}>
        <form className={styles["card"]} onSubmit={submit}>
          <div className={styles["logo"]}>
            <Logo />
            <small>Stock</small>
          </div>
          <div className="field">
            <label htmlFor="password">Wachtwoord</label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>
          {error && (
            <p className={styles["error"]} role="alert">
              {error}
            </p>
          )}
          <button type="submit" className={`btn primary ${styles["submit"]}`} disabled={busy || !password}>
            {busy ? "Bezig…" : "Inloggen"}
          </button>
        </form>
      </main>
    </>
  );
}
