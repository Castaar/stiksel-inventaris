import Head from "next/head";
import "../styles/globals.scss";
import Link from "next/link";
import { useState } from "react";

import { Toaster } from "react-hot-toast";

export default function myApp({ Component, pageProps }) {
  const [navActive, setNavActive] = useState(false);

  const handleToggleNav = () => {
    setNavActive(!navActive);
  };

  return (
    <>
      <Toaster position="bottom-center" />
      <Head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
        />
        <meta name="description" content="Description" />
        <meta name="keywords" content="Keywords" />
        <title>Castaar Inventaris</title>

        <link rel="manifest" href="/manifest.json" />
        <link
          href="/icons/favicon-16x16.png"
          rel="icon"
          type="image/png"
          sizes="16x16"
        />
        <link
          href="/icons/favicon-32x32.png"
          rel="icon"
          type="image/png"
          sizes="32x32"
        />
        <link rel="apple-touch-icon" href="/apple-icon.png"></link>
        <meta name="theme-color" content="#317EFB" />
      </Head>
      <header className="header">
        <a href="/">Castaar</a>
        <span onClick={handleToggleNav}>
          <svg
            id="icon_menu"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 35.99 36.069"
          >
            <path
              id="Path_52172"
              data-name="Path 52172"
              d="M25.147,0,16.97,8.176,8.725,0,0,8.794,8.176,16.97,0,25.147l8.726,8.795L16.97,25.7l8.176,8.245,8.726-8.795L25.7,16.97l8.176-8.176Z"
              transform="translate(1.059 1.063)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            ></path>
          </svg>
        </span>
      </header>
      {navActive && (
        <nav className="navigation">
          <Link href="/" onClick={handleToggleNav}>
            Home
          </Link>
          {/* <Link href="/stock-verminderen" onClick={handleToggleNav}>
            Stock verminderen
          </Link> */}
          <Link href="/stock" onClick={handleToggleNav}>
            Stock
          </Link>
          <Link href="/borden" onClick={handleToggleNav}>
            Borden
          </Link>
          <Link href="/stock-aanvullen" onClick={handleToggleNav}>
            Stock aanvullen
          </Link>
          <Link href="/borden-aanvullen" onClick={handleToggleNav}>
            Borden aanvullen
          </Link>
        </nav>
      )}
      <Component {...pageProps} />
    </>
  );
}
