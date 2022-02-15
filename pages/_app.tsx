import type { ExternalProvider, JsonRpcFetchFunc } from '@ethersproject/providers';
import { Web3Provider } from '@ethersproject/providers';
// fullcalendar css
import '@fullcalendar/common/main.css';
import '@fullcalendar/daygrid/main.css';
// init focalboard
import '@mattermost/compass-icons/css/compass-icons.css';
import { PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Web3ReactProvider } from '@web3-react/core';
import ErrorBoundary from 'components/common/errors/ErrorBoundary';
import RouteGuard from 'components/common/RouteGuard';
import 'components/databases/focalboard/src/components/blockIconSelector.scss';
import 'components/databases/focalboard/src/components/calculations/calculation.scss';
import 'components/databases/focalboard/src/components/calendar/fullcalendar.scss';
import 'components/databases/focalboard/src/components/cardBadges.scss';
import 'components/databases/focalboard/src/components/cardDetail/cardDetail.scss';
import 'components/databases/focalboard/src/components/cardDetail/comment.scss';
import 'components/databases/focalboard/src/components/cardDetail/commentsList.scss';
import 'components/databases/focalboard/src/components/cardDialog.scss';
import 'components/databases/focalboard/src/components/centerPanel.scss';
import 'components/databases/focalboard/src/components/confirmationDialogBox.scss';
import 'components/databases/focalboard/src/components/content/checkboxElement.scss';
import 'components/databases/focalboard/src/components/content/dividerElement.scss';
import 'components/databases/focalboard/src/components/contentBlock.scss';
import 'components/databases/focalboard/src/components/dialog.scss';
import { FlashMessages } from 'components/databases/focalboard/src/components/flashMessages';
import 'components/databases/focalboard/src/components/flashMessages.scss';
import 'components/databases/focalboard/src/components/gallery/gallery.scss';
import 'components/databases/focalboard/src/components/gallery/galleryCard.scss';
import 'components/databases/focalboard/src/components/globalHeader/globalHeader.scss';
import 'components/databases/focalboard/src/components/globalHeader/globalHeaderSettingsMenu.scss';
import 'components/databases/focalboard/src/components/kanban/calculation/calculation.scss';
import 'components/databases/focalboard/src/components/kanban/calculation/calculationOption.scss';
import 'components/databases/focalboard/src/components/kanban/kanban.scss';
import 'components/databases/focalboard/src/components/kanban/kanbanCard.scss';
import 'components/databases/focalboard/src/components/kanban/kanbanColumn.scss';
import 'components/databases/focalboard/src/components/markdownEditor.scss';
import 'components/databases/focalboard/src/components/markdownEditorInput/entryComponent/entryComponent.scss';
import 'components/databases/focalboard/src/components/markdownEditorInput/markdownEditorInput.scss';
import 'components/databases/focalboard/src/components/modal.scss';
import 'components/databases/focalboard/src/components/modalWrapper.scss';
import 'components/databases/focalboard/src/components/newVersionBanner.scss';
import 'components/databases/focalboard/src/components/properties/createdAt/createdAt.scss';
import 'components/databases/focalboard/src/components/properties/dateRange/dateRange.scss';
import 'components/databases/focalboard/src/components/properties/lastModifiedAt/lastModifiedAt.scss';
import 'components/databases/focalboard/src/components/properties/lastModifiedBy/lastModifiedBy.scss';
import 'components/databases/focalboard/src/components/properties/link/link.scss';
import 'components/databases/focalboard/src/components/properties/user/user.scss';
import 'components/databases/focalboard/src/components/shareBoardComponent.scss';
// import 'components/databases/focalboard/src/components/sidebar/deleteBoardDialog.scss';
// import 'components/databases/focalboard/src/components/sidebar/registrationLink.scss';
// import 'components/databases/focalboard/src/components/sidebar/sidebar.scss';
// import 'components/databases/focalboard/src/components/sidebar/sidebarAddBoardMenu.scss';
// import 'components/databases/focalboard/src/components/sidebar/sidebarBoardItem.scss';
// import 'components/databases/focalboard/src/components/sidebar/sidebarSettingsMenu.scss';
// import 'components/databases/focalboard/src/components/sidebar/sidebarUserMenu.scss';
import 'components/databases/focalboard/src/components/table/calculation/calculationRow.scss';
import 'components/databases/focalboard/src/components/table/horizontalGrip.scss';
import 'components/databases/focalboard/src/components/table/table.scss';
import 'components/databases/focalboard/src/components/table/tableRow.scss';
import 'components/databases/focalboard/src/components/topBar.scss';
import 'components/databases/focalboard/src/components/viewHeader/filterComponent.scss';
import 'components/databases/focalboard/src/components/viewHeader/filterEntry.scss';
import 'components/databases/focalboard/src/components/viewHeader/viewHeader.scss';
import 'components/databases/focalboard/src/components/viewTitle.scss';
import { getMessages } from 'components/databases/focalboard/src/i18n';
import store from 'components/databases/focalboard/src/store';
import { useAppDispatch, useAppSelector } from 'components/databases/focalboard/src/store/hooks';
import { fetchLanguage, getLanguage } from 'components/databases/focalboard/src/store/language';
// import 'components/databases/focalboard/src/styles/main.scss';
import 'components/databases/focalboard/src/styles/labels.scss';
import 'components/databases/focalboard/src/styles/variables.scss';
import 'components/databases/focalboard/src/styles/_markdown.scss';
import { setTheme } from 'components/databases/focalboard/src/theme';
// import 'components/databases/focalboard/src/widgets/buttons/button.scss';
import 'components/databases/focalboard/src/widgets/buttons/buttonWithMenu.scss';
import 'components/databases/focalboard/src/widgets/buttons/iconButton.scss';
import 'components/databases/focalboard/src/widgets/editable.scss';
import 'components/databases/focalboard/src/widgets/editableArea.scss';
import 'components/databases/focalboard/src/widgets/editableDayPicker.scss';
import 'components/databases/focalboard/src/widgets/emojiPicker.scss';
import 'components/databases/focalboard/src/widgets/icons/add.scss';
import 'components/databases/focalboard/src/widgets/icons/board.scss';
import 'components/databases/focalboard/src/widgets/icons/calendar.scss';
import 'components/databases/focalboard/src/widgets/icons/card.scss';
import 'components/databases/focalboard/src/widgets/icons/check.scss';
import 'components/databases/focalboard/src/widgets/icons/close.scss';
import 'components/databases/focalboard/src/widgets/icons/delete.scss';
import 'components/databases/focalboard/src/widgets/icons/disclosureTriangle.scss';
import 'components/databases/focalboard/src/widgets/icons/divider.scss';
import 'components/databases/focalboard/src/widgets/icons/dot.scss';
import 'components/databases/focalboard/src/widgets/icons/dropdown.scss';
import 'components/databases/focalboard/src/widgets/icons/duplicate.scss';
import 'components/databases/focalboard/src/widgets/icons/edit.scss';
import 'components/databases/focalboard/src/widgets/icons/emoji.scss';
import 'components/databases/focalboard/src/widgets/icons/focalboard_logo.scss';
import 'components/databases/focalboard/src/widgets/icons/gallery.scss';
import 'components/databases/focalboard/src/widgets/icons/grip.scss';
import 'components/databases/focalboard/src/widgets/icons/hamburger.scss';
import 'components/databases/focalboard/src/widgets/icons/help.scss';
import 'components/databases/focalboard/src/widgets/icons/hide.scss';
import 'components/databases/focalboard/src/widgets/icons/hideSidebar.scss';
import 'components/databases/focalboard/src/widgets/icons/image.scss';
import 'components/databases/focalboard/src/widgets/icons/link.scss';
import 'components/databases/focalboard/src/widgets/icons/logo.scss';
import 'components/databases/focalboard/src/widgets/icons/logoWithName.scss';
import 'components/databases/focalboard/src/widgets/icons/logoWithNameWhite.scss';
import 'components/databases/focalboard/src/widgets/icons/options.scss';
import 'components/databases/focalboard/src/widgets/icons/settings.scss';
import 'components/databases/focalboard/src/widgets/icons/show.scss';
import 'components/databases/focalboard/src/widgets/icons/showSidebar.scss';
import 'components/databases/focalboard/src/widgets/icons/sortDown.scss';
import 'components/databases/focalboard/src/widgets/icons/sortUp.scss';
import 'components/databases/focalboard/src/widgets/icons/submenuTriangle.scss';
import 'components/databases/focalboard/src/widgets/icons/table.scss';
import 'components/databases/focalboard/src/widgets/icons/text.scss';
import 'components/databases/focalboard/src/widgets/label.scss';
import 'components/databases/focalboard/src/widgets/menu/colorOption.scss';
import 'components/databases/focalboard/src/widgets/menu/labelOption.scss';
import 'components/databases/focalboard/src/widgets/menu/menu.scss';
import 'components/databases/focalboard/src/widgets/menu/separatorOption.scss';
import 'components/databases/focalboard/src/widgets/menu/subMenuOption.scss';
import 'components/databases/focalboard/src/widgets/menuWrapper.scss';
import 'components/databases/focalboard/src/widgets/propertyMenu.scss';
import 'components/databases/focalboard/src/widgets/switch.scss';
import 'components/databases/focalboard/src/widgets/tooltip.scss';
import 'components/databases/focalboard/src/widgets/valueSelector.scss';
import FocalBoardPortal from 'components/databases/FocalBoardPortal';
import { Web3ConnectionManager } from 'components/_app/Web3ConnectionManager';
import { ColorModeContext } from 'context/color-mode';
import { DatabaseBlocksProvider } from 'hooks/useDatabaseBlocks';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { PagesProvider } from 'hooks/usePages';
import { PageTitleProvider, TitleContext } from 'hooks/usePageTitle';
import { SpacesProvider } from 'hooks/useSpaces';
import { UserProvider } from 'hooks/useUser';
import { isMobile } from 'lib/browser';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ReactElement, ReactNode, useEffect, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { IntlProvider } from 'react-intl';
import { Provider as ReduxProvider } from 'react-redux';
import 'react-resizable/css/styles.css';
import { createThemeLightSensitive } from 'theme';
import 'theme/@bangle.dev/styles.scss';
import 'theme/focalboard/styles.scss';
import {
  darkTheme,
  lightTheme
} from 'theme/focalboard/theme';
import 'theme/styles.scss';

const getLibrary = (provider: ExternalProvider | JsonRpcFetchFunc) => new Web3Provider(provider);

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
  const [savedDarkMode, setSavedDarkMode] = useLocalStorage<PaletteMode | null>('darkMode', null);
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
  const theme = useMemo(() => {
    // set focalboard theme - dont run for SSR
    if (typeof window !== 'undefined') {
      setTheme(mode === 'dark' ? darkTheme : lightTheme);
    }
    return createThemeLightSensitive(mode);
  }, [mode]);

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
      <FocalBoardProviders>
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
              <CssBaseline enableColorScheme={true} />
              <Web3ReactProvider getLibrary={getLibrary}>
                <Web3ConnectionManager>
                  <RouteGuard>
                    <ErrorBoundary>
                      {getLayout(<Component {...pageProps} />)}
                    </ErrorBoundary>
                  </RouteGuard>
                </Web3ConnectionManager>
              </Web3ReactProvider>
            </ThemeProvider>
          </ColorModeContext.Provider>
        </DataProviders>
      </FocalBoardProviders>
      {/** include the root portal for focalboard's popup */}
      <FocalBoardPortal />
    </ReduxProvider>
  );
}

function FocalBoardProviders ({ children }: { children: ReactNode }) {

  const language = useAppSelector<string>(getLanguage);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchLanguage());
  }, []);

  return (
    <IntlProvider
      locale={language.split(/[_]/)[0]}
      messages={getMessages(language)}
    >
      <DndProvider backend={isMobile() ? TouchBackend : HTML5Backend}>
        <FlashMessages milliseconds={2000} />
        {children}
      </DndProvider>
    </IntlProvider>
  );
}

function DataProviders ({ children }: { children: ReactNode }) {
  return (
    <SpacesProvider>
      <PagesProvider>
        <DatabaseBlocksProvider>
          <PageTitleProvider>
            <UserProvider>
              {children}
            </UserProvider>
          </PageTitleProvider>
        </DatabaseBlocksProvider>
      </PagesProvider>
    </SpacesProvider>
  );
}
