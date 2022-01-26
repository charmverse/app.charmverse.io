import { UserProvider } from '@auth0/nextjs-auth0';
import CssBaseline from '@mui/material/CssBaseline';
import { PaletteMode } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import type { NextPage } from 'next';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import RouteGuard from 'components/common/RouteGuard';
import 'styles/index.css';
import { createThemeLightSensitive } from 'theme';
import { ColorModeContext } from 'context/color-mode';
import { PageTitleProvider, TitleContext } from 'components/common/page-layout/PageTitle';

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

  // dark mode: https://mui.com/customization/dark-mode/
  const [mode, setMode] = useState<PaletteMode>('light');
  const colorMode = useMemo(
    () => ({
      // The dark mode switch would invoke this method
      toggleColorMode: () => {
        console.log('toggle color mode');
        setMode((prevMode: PaletteMode) =>
          prevMode === 'light' ? 'dark' : 'light',
        );
      },
    }),
    [],
  );
  // Update the theme only if the mode changes
  const theme = useMemo(() => createThemeLightSensitive(mode), [mode]);

  return (
    <PageTitleProvider>
      <TitleContext.Consumer>
        {([title]) => (
          <Head>
            <title>
              {title ? `${title} | CharmVerse` : 'CharmVerse - the all-in-one web3 workspace'}
            </title>
          </Head>
        )}
      </TitleContext.Consumer>
      <Head>
        <meta name='description' content='The Notion of Web3' />
        <meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width' />
      </Head>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <UserProvider>
            <RouteGuard>
              {getLayout(<Component {...pageProps} />)}
            </RouteGuard>
          </UserProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </PageTitleProvider>
  );
}
