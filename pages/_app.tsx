import { UserProvider } from '@auth0/nextjs-auth0';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import type { NextPage } from 'next';
import { ReactElement, useEffect } from 'react';
import RouteGuard from 'components/common/RouteGuard';
import "styles/index.css";
import { theme } from 'theme';

type NextPageWithLayout = NextPage & {
  getLayout: (page: ReactElement) => JSX.Element
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function App({ Component, pageProps }: AppPropsWithLayout) {

  const getLayout = Component.getLayout ?? ((page) => page);

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles?.parentElement) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  const siteDescription = 'The Notion of Web3';

  return (
    <>
      <Head>
        <title>Web3 Editor by CharmVerse</title>
        <meta name='description' content={siteDescription} />
        <meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width' />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <UserProvider>
          <RouteGuard>
            {getLayout(<Component {...pageProps} />)}
          </RouteGuard>
        </UserProvider>
      </ThemeProvider>
    </>
  );
}
