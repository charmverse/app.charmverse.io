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
          <meta name='description' content='The First Web 3 Native All-in-one Workspace' />
          <meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width' />
          <meta property='og:title' content='CharmVerse' />
          <meta property='og:image' content='https://app.charmverse.io/images/charmverse_logo_sm_black.png' />
          <meta property='twitter:title' content='CharmVerse' />
          <meta property='twitter:description' content='The First Web 3 Native All-in-one Workspace' />
          <meta property='twitter:image' content='https://app.charmverse.io/images/charmverse_logo_sm_black.png' />
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
