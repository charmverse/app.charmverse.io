/* eslint-disable @next/next/no-sync-scripts */
import { charmBlue as blueColor } from '@root/config/colors';
import Document, { Head, Html, Main, NextScript } from 'next/document';

// Source for Emotion SSR: https://github.com/mui/material-ui/tree/332081eb5e5e107d915e3c70f92e430dc364048f/examples/nextjs-with-typescript

class MyDocument extends Document {
  render() {
    return (
      <Html lang='en'>
        <Head>
          <meta name='theme-color' content={blueColor} />
          <link rel='icon' href='/favicon.png' />
          <script src='/__ENV.js' />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
export default MyDocument;
