import createCache from '@emotion/cache';
import createEmotionServer from '@emotion/server/create-instance';
import Document, { Head, Html, Main, NextScript } from 'next/document';
import React from 'react';

import { blueColor } from 'theme/colors';

// Source for Emotion SSR: https://github.com/mui/material-ui/tree/332081eb5e5e107d915e3c70f92e430dc364048f/examples/nextjs-with-typescript

class MyDocument extends Document<{ emotionStyleTags: any }> {
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
          {(this.props as any).emotionStyleTags}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

function createEmotionCache() {
  return createCache({ key: 'mui-style' });
}

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with static-site generation (SSG).
MyDocument.getInitialProps = async (ctx) => {
  // Resolution order
  //
  // On the server:
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. document.getInitialProps
  // 4. app.render
  // 5. page.render
  // 6. document.render
  //
  // On the server with error:
  // 1. document.getInitialProps
  // 2. app.render
  // 3. page.render
  // 4. document.render
  //
  // On the client
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. app.render
  // 4. page.render

  const originalRenderPage = ctx.renderPage;

  // You can consider sharing the same Emotion cache between all the SSR requests to speed up performance.
  // However, be aware that it can have global side effects.
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App: any) => (props) => <App emotionCache={cache} {...props} />
    });

  const initialProps = await Document.getInitialProps(ctx);
  // This is important. It prevents Emotion to render invalid HTML.
  // See https://github.com/mui/material-ui/issues/26561#issuecomment-855286153
  const emotionStyles = extractCriticalToChunks(initialProps.html);
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(' ')}`}
      key={style.key}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ));

  return {
    ...initialProps,
    styles: [...React.Children.toArray(initialProps.styles), ...emotionStyleTags]
  };
};

export default MyDocument;
