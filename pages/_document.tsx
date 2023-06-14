import Document, { Head, Html, Main, NextScript } from 'next/document';
import React from 'react';

import { blueColor } from 'theme/colors';

// Source for Emotion SSR: https://github.com/mui/material-ui/tree/332081eb5e5e107d915e3c70f92e430dc364048f/examples/nextjs-with-typescript

class MyDocument extends Document {
  render() {
    return (
      <Html lang='en'>
        <Head>
          <meta name='theme-color' content={blueColor} />
          <link rel='icon' href='/favicon.png' />
          <meta
            name='description'
            content='web3 operations platform handling docs, tasks, bounties, proposals, and votes.'
          />
          <meta property='og:title' content='CharmVerse' />
          <meta property='og:image' content='https://app.charmverse.io/images/logo_black_lightgrey_opengraph.png' />
          <meta
            property='og:description'
            content='web3 operations platform handling docs, tasks, bounties, proposals, and votes.'
          />
          <meta property='twitter:title' content='CharmVerse' />
          <meta
            property='twitter:description'
            content='web3 operations platform handling docs, tasks, bounties, proposals, and votes.'
          />
          <meta
            property='twitter:image'
            content='https://app.charmverse.io/images/logo_black_lightgrey_opengraph.png'
          />
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
