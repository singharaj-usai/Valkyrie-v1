// src/pages/_app.js

import Head from 'next/head';
import Script from 'next/script';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar/Navbar';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.7/cosmo/bootstrap.min.css"
          id="theme-stylesheet"
        />
      </Head>

      <Script
        src="https://code.jquery.com/jquery-1.12.4.min.js"
        strategy="beforeInteractive"
      />

      <Script
        src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"
        strategy="afterInteractive"
      />

      <Navbar />
      <main className="container mt-4">
        <Component {...pageProps} />
      </main>
    </AuthProvider>
  );
}

export default MyApp;