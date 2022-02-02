import { PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { PageTitleProvider, TitleContext } from 'components/common/page-layout/PageTitle';
import RouteGuard from 'components/common/RouteGuard';
import { ColorModeContext } from 'context/color-mode';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { SpacesProvider } from 'hooks/useSpaces';
import { PagesProvider } from 'hooks/usePages';
import { UserProvider } from 'hooks/useUser';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ReactElement, ReactNode, useEffect, useMemo, useState } from 'react';
import { createThemeLightSensitive } from 'theme';

// fullcalendar css
import '@fullcalendar/common/main.css';
import '@fullcalendar/daygrid/main.css';

// init focalboard
import '@mattermost/compass-icons/css/compass-icons.css';
import 'components/databases/focalboard/src/components/blockIconSelector.scss';
import 'components/databases/focalboard/src/components/calculations/calculation.scss';
import 'components/databases/focalboard/src/components/calendar/fullcalendar.scss';
import 'components/databases/focalboard/src/styles/variables.scss';
import 'components/databases/focalboard/src/styles/main.scss';
import 'components/databases/focalboard/src/styles/labels.scss';
import 'components/databases/focalboard/src/styles/_markdown.scss';
import { ReduxProvider, store } from 'components/databases/focalboard/src/main';

import 'theme/styles.scss';

type NextPageWithLayout = NextPage & {
  getLayout: (page: ReactElement) => ReactElement
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function App ({ Component, pageProps }: AppPropsWithLayout) {

  const getLayout = Component.getLayout ?? (page => page);

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles?.parentElement) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  // dark mode: https://mui.com/customization/dark-mode/
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [savedDarkMode, setSavedDarkMode] = useLocalStorage<PaletteMode>('darkMode');
  const [mode, setMode] = useState<PaletteMode>('light');
  const colorMode = useMemo(
    () => ({
      // The dark mode switch would invoke this method
      toggleColorMode: () => {
        setMode((prevMode: PaletteMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          setSavedDarkMode(newMode);
          return newMode;
        });
      }
    }),
    []
  );

  // Update the theme only if the mode changes
  const theme = useMemo(() => createThemeLightSensitive(mode), [mode]);

  useEffect(() => {
    if (savedDarkMode) {
      setMode(savedDarkMode);
    }
    else if (prefersDarkMode) {
      setMode('dark');
    }
  }, [prefersDarkMode, savedDarkMode]);

  // wait for router to be ready, as we rely on the URL to know what space to load
  const router = useRouter();
  if (!router.isReady) {
    return null;
  }

  return (
    <ReduxProvider store={store}>
      <DataProviders>
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
            <RouteGuard>
              {getLayout(<Component {...pageProps} />)}
            </RouteGuard>
          </ThemeProvider>
        </ColorModeContext.Provider>
      </DataProviders>
    </ReduxProvider>
  );
}

function DataProviders ({ children }: { children: ReactNode }) {
  return (
    <SpacesProvider>
      <PagesProvider>
        <PageTitleProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </PageTitleProvider>
      </PagesProvider>
    </SpacesProvider>
  );
}
