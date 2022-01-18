import Document, { Head, Html, Main, NextScript } from 'next/document';


// set up styles in Next.js for MUI based on https://github.com/mui-org/material-ui/blob/next/examples/nextjs-with-typescript/pages/_document.tsx

import { theme } from '../theme';

class MyDocument extends Document {

  render() {
    return (
      <Html lang='en'>
        <Head>
          <meta name='theme-color' content={theme.palette.primary.main} />
          <link rel='shortcut icon' href='/favicon.png' />
          <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css?family=Roboto Mono:300,400,500,700" rel="stylesheet" />
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
