import Document, { Head, Html, Main, NextScript } from 'next/document';

// set up styles in Next.js for MUI based on https://github.com/mui-org/material-ui/blob/next/examples/nextjs-with-typescript/pages/_document.tsx

import { blueColor } from 'theme/colors';

class MyDocument extends Document {

  render () {
    return (
      <Html lang='en'>
        <Head>
          <meta name='theme-color' content={blueColor} />
          <link rel='icon' href='/favicon.png' />
          <meta name='description' content='web3 operations platform handling docs, tasks, bounties, proposals, and votes.' />
          <meta property='og:title' content='CharmVerse' />
          <meta property='og:image' content='https://app.charmverse.io/images/logo_black_lightgrey_opengraph.png' />
          <meta property='og:description' content='web3 operations platform handling docs, tasks, bounties, proposals, and votes.' />
          <meta property='twitter:title' content='CharmVerse' />
          <meta property='twitter:description' content='web3 operations platform handling docs, tasks, bounties, proposals, and votes.' />
          <meta property='twitter:image' content='https://app.charmverse.io/images/logo_black_lightgrey_opengraph.png' />
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
