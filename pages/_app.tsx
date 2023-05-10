import { CacheProvider } from '@emotion/react';
import type { EmotionCache } from '@emotion/utils';
import type { ExternalProvider, JsonRpcFetchFunc } from '@ethersproject/providers';
import { Web3Provider } from '@ethersproject/providers';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import { Web3ReactProvider } from '@web3-react/core';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { SWRConfig } from 'swr';

import charmClient from 'charmClient';
import GlobalComponents from 'components/_app/GlobalComponents';
import { LocalizationProvider } from 'components/_app/LocalizationProvider';
import { Web3ConnectionManager } from 'components/_app/Web3ConnectionManager';
import FocalBoardProvider from 'components/common/BoardEditor/FocalBoardProvider';
import ErrorBoundary from 'components/common/errors/ErrorBoundary';
import IntlProvider from 'components/common/IntlProvider';
import { NotificationsProvider } from 'components/common/PageLayout/components/Header/components/NotificationPreview/useNotifications';
import ReactDndProvider from 'components/common/ReactDndProvider';
import RouteGuard from 'components/common/RouteGuard';
import Snackbar from 'components/common/Snackbar';
import { MemberProfileProvider } from 'components/profile/hooks/useMemberProfile';
import { isDevEnv } from 'config/constants';
import { BountiesProvider } from 'hooks/useBounties';
import { DiscordProvider } from 'hooks/useDiscordConnection';
import { PostCategoriesProvider } from 'hooks/useForumCategories';
import { useInterval } from 'hooks/useInterval';
import { IsSpaceMemberProvider } from 'hooks/useIsSpaceMember';
import { MembersProvider } from 'hooks/useMembers';
import { NotionProvider } from 'hooks/useNotionImport';
import { OnboardingProvider } from 'hooks/useOnboarding';
import { PagesProvider } from 'hooks/usePages';
import { PageTitleProvider, usePageTitle } from 'hooks/usePageTitle';
import { PaymentMethodsProvider } from 'hooks/usePaymentMethods';
import { SettingsDialogProvider } from 'hooks/useSettingsDialog';
import { SnackbarProvider } from 'hooks/useSnackbar';
import { SpacesProvider } from 'hooks/useSpaces';
import { UserProvider } from 'hooks/useUser';
import { useUserAcquisition } from 'hooks/useUserAcquisition';
import { Web3AccountProvider } from 'hooks/useWeb3AuthSig';
import { WebSocketClientProvider } from 'hooks/useWebSocketClient';
import { AppThemeProvider } from 'theme/AppThemeProvider';
import { createEmotionCache } from 'theme/createEmotionCache';
import '@bangle.dev/tooltip/style.css';
import '@skiff-org/prosemirror-tables/style/table-filters.css';
import '@skiff-org/prosemirror-tables/style/table-headers.css';
import '@skiff-org/prosemirror-tables/style/table-popup.css';
import '@skiff-org/prosemirror-tables/style/tables.css';
import 'prosemirror-menu/style/menu.css';
import 'theme/@bangle.dev/styles.scss';
import 'theme/prosemirror-tables/prosemirror-tables.scss';
import 'theme/print.scss';
import 'components/common/BoardEditor/focalboard/src/components/blockIconSelector.scss';
import 'components/common/BoardEditor/focalboard/src/components/calculations/calculation.scss';
import 'components/common/BoardEditor/focalboard/src/components/calendar/fullcalendar.scss';
import 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetail.scss';
import 'components/common/BoardEditor/focalboard/src/components/cardDetail/comment.scss';
import 'components/common/BoardEditor/focalboard/src/components/cardDetail/commentsList.scss';
import 'components/common/BoardEditor/focalboard/src/components/cardDialog.scss';
import 'components/common/BoardEditor/focalboard/src/components/centerPanel.scss';
import 'components/common/BoardEditor/focalboard/src/components/dialog.scss';
import 'components/common/BoardEditor/focalboard/src/components/gallery/gallery.scss';
import 'components/common/BoardEditor/focalboard/src/components/gallery/galleryCard.scss';
import 'components/common/BoardEditor/focalboard/src/components/kanban/calculation/calculation.scss';
import 'components/common/BoardEditor/focalboard/src/components/kanban/calculation/calculationOption.scss';
import 'components/common/BoardEditor/focalboard/src/components/kanban/kanban.scss';
import 'components/common/BoardEditor/focalboard/src/components/kanban/kanbanCard.scss';
import 'components/common/BoardEditor/focalboard/src/components/kanban/kanbanColumn.scss';
import 'components/common/BoardEditor/focalboard/src/components/properties/createdAt/createdAt.scss';
import 'components/common/BoardEditor/focalboard/src/components/properties/dateRange/dateRange.scss';
import 'components/common/BoardEditor/focalboard/src/components/properties/lastModifiedAt/lastModifiedAt.scss';
import 'components/common/BoardEditor/focalboard/src/components/properties/link/link.scss';
import 'components/common/BoardEditor/focalboard/src/components/table/calculation/calculationRow.scss';
import 'components/common/BoardEditor/focalboard/src/components/table/horizontalGrip.scss';
import 'components/common/BoardEditor/focalboard/src/components/table/table.scss';
import 'components/common/BoardEditor/focalboard/src/components/table/tableRow.scss';
import 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewHeader.scss';
import 'components/common/BoardEditor/focalboard/src/components/viewTitle.scss';
import 'components/common/BoardEditor/focalboard/src/styles/labels.scss';
import 'components/common/BoardEditor/focalboard/src/styles/_markdown.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/buttons/iconButton.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/editable.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/emojiPicker.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/label.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menu/colorOption.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menu/labelOption.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menu/menu.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menu/separatorOption.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menu/subMenuOption.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menuWrapper.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/propertyMenu.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/switch.scss';
import 'theme/focalboard/focalboard.button.scss';
import 'theme/focalboard/focalboard.main.scss';
import 'lit-share-modal-v3/dist/ShareModal.css';
import 'react-resizable/css/styles.css';
import 'theme/lit-protocol/lit-protocol.scss';
import 'theme/styles.scss';

const getLibrary = (provider: ExternalProvider | JsonRpcFetchFunc) => new Web3Provider(provider);

const clientSideEmotionCache = createEmotionCache();

type NextPageWithLayout = NextPage & {
  getLayout: (page: ReactElement) => ReactElement;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
  emotionCache?: EmotionCache;
};
export default function App({ Component, emotionCache = clientSideEmotionCache, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);
  const router = useRouter();

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles?.parentElement) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  const [isOldBuild, setIsOldBuild] = useState(false);

  // Check if a new version of the application is available every 5 minutes.
  useInterval(async () => {
    const data = await charmClient.getBuildId();
    if (data.buildId !== process.env.NEXT_PUBLIC_BUILD_ID) {
      setIsOldBuild(true);
    }
  }, 180000);

  // wait for router to be ready, as we rely on the URL to know what space to load

  const { refreshSignupData } = useUserAcquisition();

  useEffect(() => {
    if (router.isReady) {
      refreshSignupData();
    }
  }, [router.isReady]);

  // DO NOT REMOVE CacheProvider - it protects MUI from Tailwind CSS in settings
  return (
    <CacheProvider value={emotionCache}>
      <AppThemeProvider>
        <SnackbarProvider>
          <ReactDndProvider>
            <DataProviders>
              <SettingsDialogProvider>
                <NotificationsProvider>
                  <LocalizationProvider>
                    <OnboardingProvider>
                      <FocalBoardProvider>
                        <NotionProvider>
                          <IntlProvider>
                            <PageHead />

                            <RouteGuard>
                              <ErrorBoundary>
                                <Snackbar
                                  isOpen={isOldBuild}
                                  message='New CharmVerse platform update available. Please refresh.'
                                  actions={[
                                    <IconButton key='reload' onClick={() => window.location.reload()} color='inherit'>
                                      <RefreshIcon fontSize='small' />
                                    </IconButton>
                                  ]}
                                  origin={{ vertical: 'top', horizontal: 'center' }}
                                  severity='warning'
                                  handleClose={() => setIsOldBuild(false)}
                                />

                                {getLayout(<Component {...pageProps} />)}

                                <GlobalComponents />
                              </ErrorBoundary>
                            </RouteGuard>
                          </IntlProvider>
                        </NotionProvider>
                      </FocalBoardProvider>
                    </OnboardingProvider>
                  </LocalizationProvider>
                </NotificationsProvider>
              </SettingsDialogProvider>
            </DataProviders>
          </ReactDndProvider>
        </SnackbarProvider>
      </AppThemeProvider>
    </CacheProvider>
  );
}

function DataProviders({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        shouldRetryOnError(err) {
          return err.status >= 500;
        }
      }}
    >
      <UserProvider>
        <DiscordProvider>
          <Web3ReactProvider getLibrary={getLibrary}>
            <Web3ConnectionManager>
              <Web3AccountProvider>
                <SpacesProvider>
                  <PostCategoriesProvider>
                    <IsSpaceMemberProvider>
                      <WebSocketClientProvider>
                        <MembersProvider>
                          <BountiesProvider>
                            <PaymentMethodsProvider>
                              <PagesProvider>
                                <MemberProfileProvider>
                                  <PageTitleProvider>{children}</PageTitleProvider>
                                </MemberProfileProvider>
                              </PagesProvider>
                            </PaymentMethodsProvider>
                          </BountiesProvider>
                        </MembersProvider>
                      </WebSocketClientProvider>
                    </IsSpaceMemberProvider>
                  </PostCategoriesProvider>
                </SpacesProvider>
              </Web3AccountProvider>
            </Web3ConnectionManager>
          </Web3ReactProvider>
        </DiscordProvider>
      </UserProvider>
    </SWRConfig>
  );
}

function PageHead() {
  const [title] = usePageTitle();
  const prefix = isDevEnv ? 'DEV | ' : '';

  return (
    <Head>
      <title>{title ? `${prefix}${title} | CharmVerse` : `${prefix}CharmVerse - the all-in-one web3 space`}</title>
      {/* viewport meta tag goes in _app.tsx - https://nextjs.org/docs/messages/no-document-viewport-meta */}
      <meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width' />
      {/* Verification required by google */}
      <meta name='google-site-verification' content='AhWgWbPVQIsHKmPNTkUSI-hN38XbkpCIrt40-4IgaiM' />
    </Head>
  );
}
