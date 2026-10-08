import Head from "next/head";
import { useRouter } from "next/router";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";

import "../styles/globals.scss";

// Gobold Lowplus Italic, the heading typeface of stiksel.com (one weight)
const gobold = localFont({
  src: [{ path: "../styles/fonts/Gobold-Lowplus-Italic.ttf", weight: "400", style: "normal" }],
  variable: "--font-gobold",
});

export default function App({ Component, pageProps }) {
  const router = useRouter();

  return (
    <div className={`app ${gobold.variable}`}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="Stiksel stock inventaris" />
        <title>Stiksel Stock</title>

        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/images/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "var(--strong)",
            color: "var(--strong-ink)",
            borderRadius: "999px",
            fontWeight: 600,
          },
          error: { style: { background: "var(--low)", color: "#fff" } },
        }}
      />
      <Component {...pageProps} key={router.pathname} />
    </div>
  );
}
