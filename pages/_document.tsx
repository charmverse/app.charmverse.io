import createCache from '@emotion/cache';
import createEmotionServer from '@emotion/server/create-instance';
import Document, { Head, Html, Main, NextScript } from 'next/document';

// set up styles in Next.js for MUI based on https://github.com/mui-org/material-ui/blob/next/examples/nextjs-with-typescript/pages/_document.tsx
// Set up MUI xample: https://github.com/mui/material-ui/blob/master/examples/nextjs/pages/_document.js

import { blueColor } from 'theme/colors';

class MyDocument extends Document<{ emotionStyleTags: any }> {
  // static async getInitialProps(ctx: any) {
  //   const originalRenderPage = ctx.renderPage;

  //   const cache = createCache({ key: 'app', prepend: true });
  //   const { extractCriticalToChunks } = createEmotionServer(cache);

  //   ctx.renderPage = () =>
  //     originalRenderPage({
  //       enhanceApp: (App: any) =>
  //         function EnhanceApp(props: any) {
  //           return <App emotionCache={cache} {...props} />;
  //         }
  //     });

  //   const initialProps = await Document.getInitialProps(ctx);
  //   // This is important. It prevents Emotion to render invalid HTML.
  //   // See https://github.com/mui/material-ui/issues/26561#issuecomment-855286153
  //   const emotionStyles = extractCriticalToChunks(initialProps.html);
  //   const emotionStyleTags = emotionStyles.styles.map((style) => (
  //     <style
  //       data-emotion={`${style.key} ${style.ids.join(' ')}`}
  //       key={style.key}
  //       // eslint-disable-next-line react/no-danger
  //       dangerouslySetInnerHTML={{ __html: style.css }}
  //     />
  //   ));
  //   return {
  //     ...initialProps,
  //     emotionStyleTags
  //   };
  // }

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
          {/* {this.props.emotionStyleTags} */}
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
