import Head from "next/head";
import Image from 'next/image';

import "../styles/globals.scss";
import { useRouter } from "next/router";

import { Toaster } from "react-hot-toast";

export default function myApp({ Component, pageProps }) {
  const router = useRouter();

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
        <meta name="description" content="Stiksel stock inventaris" />
        <title>Stiksel Inventaris</title>

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
        <a href="/">
          <Image
            src="/images/logo-castaar.svg"
            alt="Logo Stiksel"
            width={230}
            height={34}
          />
        </a>
      </header>
      <Component {...pageProps} key={router.asPath} />
    </>
  );
}