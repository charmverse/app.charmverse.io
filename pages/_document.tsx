import Document, { Head, Html, Main, NextScript } from 'next/document';


// set up styles in Next.js for MUI based on https://github.com/mui-org/material-ui/blob/next/examples/nextjs-with-typescript/pages/_document.tsx

import { blueColor } from 'theme/colors';

class MyDocument extends Document {

  render() {
    return (
      <Html lang='en'>
        <Head>
          <meta name='theme-color' content={blueColor} />
          <link rel='shortcut icon' href='/favicon.png' />
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
