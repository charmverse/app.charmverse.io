/* eslint-disable @next/next/no-sync-scripts */
import { DocumentHeadTags, documentGetInitialProps } from '@mui/material-nextjs/v15-pagesRouter';
import { charmBlue as blueColor } from '@packages/config/colors';
import Document, { Head, Html, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang='en'>
        <Head>
          <DocumentHeadTags {...props} />
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

MyDocument.getInitialProps = async (ctx) => {
  const finalProps = await documentGetInitialProps(ctx);
  return finalProps;
};

export default MyDocument;
