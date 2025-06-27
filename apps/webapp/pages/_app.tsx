import env from '@beam-australia/react-env';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import { isDevEnv, isProdEnv } from '@packages/config/constants';
import { log } from '@packages/core/log';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { SWRConfig } from 'swr';

import charmClient from 'charmClient';
import { BaseAuthenticateProviders } from 'components/_app/BaseAuthenticateProviders';
import { Snackbar } from 'components/_app/components/Snackbar';
import { WagmiProvider } from 'components/_app/components/WagmiProvider';
import { GlobalComponents } from 'components/_app/GlobalComponents';
import { LocalizationProvider } from 'components/_app/LocalizationProvider';
import type { OpenGraphProps } from 'components/_app/OpenGraphData';
import { OpenGraphData } from 'components/_app/OpenGraphData';
import { Web3ConnectionManager } from 'components/_app/Web3ConnectionManager';
import { WalletSelectorModal } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/WalletSelectorModal';
import { DatabaseProvider } from 'components/common/DatabaseEditor/DatabaseProvider';
import ErrorBoundary from 'components/common/errors/ErrorBoundary';
import IntlProvider from 'components/common/IntlProvider';
import ReactDndProvider from 'components/common/ReactDndProvider';
import RouteGuard from 'components/common/RouteGuard';
import { UserProfileProvider } from 'components/members/hooks/useMemberProfileDialog';
import { RewardsProvider } from 'components/rewards/hooks/useRewards';
import { ConfirmationModalProvider } from 'hooks/useConfirmationModal';
import { CurrentSpaceProvider } from 'hooks/useCurrentSpace';
import { DiscordProvider } from 'hooks/useDiscordConnection';
import { FarcasterUserProvider } from 'hooks/useFarcasterUser';
import { PostCategoriesProvider } from 'hooks/useForumCategories';
import { useInterval } from 'hooks/useInterval';
import { IsSpaceMemberProvider } from 'hooks/useIsSpaceMember';
import { DbViewSettingsProvider } from 'hooks/useLocalDbViewSettings';
import { MemberPropertiesProvider } from 'hooks/useMemberProperties';
import { MembersProvider } from 'hooks/useMembers';
import { NotionProvider } from 'hooks/useNotionImport';
import { PagesProvider } from 'hooks/usePages';
import { PageTitleProvider, usePageTitle } from 'hooks/usePageTitle';
import { PaymentMethodsProvider } from 'hooks/usePaymentMethods';
import { SettingsDialogProvider } from 'hooks/useSettingsDialog';
import { SnackbarProvider } from 'hooks/useSnackbar';
import { SpacesProvider } from 'hooks/useSpaces';
import { UserProvider } from 'hooks/useUser';
import { useUserAcquisition } from 'hooks/useUserAcquisition';
import { VerifyLoginOtpProvider } from 'hooks/useVerifyLoginOtp';
import { Web3AccountProvider } from 'hooks/useWeb3Account';
import { WebSocketClientProvider } from 'hooks/useWebSocketClient';
import { AppThemeProvider } from 'theme/AppThemeProvider';

import 'components/common/DatabaseEditor/components/calculations/calculation.scss';
import 'components/common/DatabaseEditor/components/calendar/fullcalendar.scss';
import 'components/common/DatabaseEditor/components/cardDetail/cardDetail.scss';
import 'components/common/DatabaseEditor/components/centerPanel.scss';
import 'components/common/DatabaseEditor/components/dialog.scss';
import 'components/common/DatabaseEditor/components/gallery/gallery.scss';
import 'components/common/DatabaseEditor/components/gallery/galleryCard.scss';
import 'components/common/DatabaseEditor/components/kanban/calculation/calculation.scss';
import 'components/common/DatabaseEditor/components/kanban/calculation/calculationOption.scss';
import 'components/common/DatabaseEditor/components/kanban/kanban.scss';
import 'components/common/DatabaseEditor/components/kanban/kanbanCard.scss';
import 'components/common/DatabaseEditor/components/kanban/kanbanColumn.scss';
import 'components/common/DatabaseEditor/components/properties/dateRange/dateRange.scss';
import 'components/common/DatabaseEditor/components/properties/link/link.scss';
import 'components/common/DatabaseEditor/components/table/calculation/calculationRow.scss';
import 'components/common/DatabaseEditor/components/table/horizontalGrip.scss';
import 'components/common/DatabaseEditor/components/table/table.scss';
import 'components/common/DatabaseEditor/components/table/tableRow.scss';
import 'components/common/DatabaseEditor/components/viewHeader/viewHeader.scss';
import 'components/common/DatabaseEditor/components/viewTitle.scss';
import 'components/common/DatabaseEditor/styles/_markdown.scss';
import 'components/common/DatabaseEditor/styles/labels.scss';
import 'components/common/DatabaseEditor/widgets/buttons/iconButton.scss';
import 'components/common/DatabaseEditor/widgets/checkbox.scss';
import 'components/common/DatabaseEditor/widgets/editable.scss';
import 'components/common/DatabaseEditor/widgets/emojiPicker.scss';
import 'components/common/DatabaseEditor/widgets/label.scss';
import 'components/common/DatabaseEditor/widgets/menu/colorOption.scss';
import 'components/common/DatabaseEditor/widgets/menu/labelOption.scss';
import 'components/common/DatabaseEditor/widgets/menu/menu.scss';
import 'components/common/DatabaseEditor/widgets/menu/separatorOption.scss';
import 'components/common/DatabaseEditor/widgets/menu/subMenuOption.scss';
import 'components/common/DatabaseEditor/widgets/menuWrapper.scss';
import 'components/common/DatabaseEditor/widgets/propertyMenu.scss';
import 'prosemirror-menu/style/menu.css';
import 'react-resizable/css/styles.css';
import 'theme/@bangle.dev/styles.scss';
import 'theme/databases/databases.button.scss';
import 'theme/databases/databases.main.scss';
import 'theme/print.scss';
import 'theme/prosemirror-tables/prosemirror-tables.scss';
import 'theme/styles.scss';

// Prosemirror tables
import 'components/common/CharmEditor/components/table/ui/czi-table-grid-size-editor.css';
import 'components/common/CharmEditor/components/table/ui/czi-color-editor.css';

type NextPageWithLayout = NextPage & {
  getLayout: (page: ReactElement) => ReactElement;
};

export type GlobalPageProps = {
  openGraphData: OpenGraphProps;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};
export default function App({ Component, pageProps, router }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

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
    if (!isOldBuild && data.buildId !== env('BUILD_ID')) {
      setIsOldBuild(true);
      log.info('Requested user to refresh their browser to get new version', {
        oldVersion: env('BUILD_ID'),
        newVersion: data.buildId
      });
    }
  }, 180000);

  // wait for router to be ready, as we rely on the URL to know what space to load

  const { refreshSignupData } = useUserAcquisition();

  useEffect(() => {
    if (router.isReady) {
      refreshSignupData();
    }
  }, [router.isReady]);

  if (router.pathname.startsWith('/authenticate')) {
    return (
      <BaseAuthenticateProviders>
        <Component {...pageProps} />
        <Snackbar />
      </BaseAuthenticateProviders>
    );
  }

  return (
    <AppThemeProvider>
      <SnackbarProvider>
        <ConfirmationModalProvider>
          <ReactDndProvider>
            <DataProviders>
              <SettingsDialogProvider>
                <LocalizationProvider>
                  <NotionProvider>
                    <IntlProvider>
                      <DbViewSettingsProvider>
                        <PageHead {...pageProps} />

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
                      </DbViewSettingsProvider>
                    </IntlProvider>
                  </NotionProvider>
                </LocalizationProvider>
              </SettingsDialogProvider>
            </DataProviders>
          </ReactDndProvider>
        </ConfirmationModalProvider>
      </SnackbarProvider>
    </AppThemeProvider>
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
        <VerifyLoginOtpProvider>
          <DiscordProvider>
            <WagmiProvider>
              <Web3ConnectionManager>
                <WalletSelectorModal />
                <Web3AccountProvider>
                  <SpacesProvider>
                    <CurrentSpaceProvider>
                      <PostCategoriesProvider>
                        <IsSpaceMemberProvider>
                          <WebSocketClientProvider>
                            <MembersProvider>
                              <PaymentMethodsProvider>
                                <DatabaseProvider>
                                  <PagesProvider>
                                    <RewardsProvider>
                                      <MemberPropertiesProvider>
                                        <FarcasterUserProvider>
                                          <UserProfileProvider>
                                            <PageTitleProvider>{children}</PageTitleProvider>
                                          </UserProfileProvider>
                                        </FarcasterUserProvider>
                                      </MemberPropertiesProvider>
                                    </RewardsProvider>
                                  </PagesProvider>
                                </DatabaseProvider>
                              </PaymentMethodsProvider>
                            </MembersProvider>
                          </WebSocketClientProvider>
                        </IsSpaceMemberProvider>
                      </PostCategoriesProvider>
                    </CurrentSpaceProvider>
                  </SpacesProvider>
                </Web3AccountProvider>
              </Web3ConnectionManager>
            </WagmiProvider>
          </DiscordProvider>
        </VerifyLoginOtpProvider>
      </UserProvider>
    </SWRConfig>
  );
}

function PageHead({ openGraphData }: { openGraphData?: OpenGraphProps }) {
  const [title] = usePageTitle();
  const prefix = isDevEnv ? 'DEV |' : '';
  const titleString = `${prefix} ${title || `CharmVerse - The Network for Onchain Communities`}`;

  return (
    <Head>
      <title>{titleString}</title>
      {/* viewport meta tag goes in _app.tsx - https://nextjs.org/docs/messages/no-document-viewport-meta */}
      <meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width' />
      {/* Verification required by google */}
      <meta name='google-site-verification' content='AhWgWbPVQIsHKmPNTkUSI-hN38XbkpCIrt40-4IgaiM' />

      <OpenGraphData {...openGraphData} />
    </Head>
  );
}
