import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import MuiDrawer from '@mui/material/Drawer';
import Head from 'next/head';
import * as React from 'react';

import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import PageDialogGlobalModal from 'components/common/PageDialog/PageDialogGlobal';
import { FocalboardViewsProvider } from 'hooks/useFocalboardViews';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { PageActionDisplayProvider } from 'hooks/usePageActionDisplay';
import { ThreadsProvider } from 'hooks/useThreads';
import { useUser } from 'hooks/useUser';
import { VotesProvider } from 'hooks/useVotes';
import { isSmallScreen } from 'lib/utilities/browser';

import CurrentPageFavicon from './components/CurrentPageFavicon';
import Header, { headerHeight } from './components/Header';
import PageContainer from './components/PageContainer';
import Sidebar from './components/Sidebar';

const openedMixin = (theme: Theme, sidebarWidth: number) => ({
  maxWidth: '100%',
  width: sidebarWidth,
  transition: theme.transitions.create(['width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen
  }),
  overflowX: 'hidden'
});

const closedMixin = (theme: Theme) => ({
  transition: theme.transitions.create(['width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  overflowX: 'hidden',
  width: 0
}) as const;

export const AppBar = styled(MuiAppBar, { shouldForwardProp: (prop: string) => prop !== 'sidebarWidth' && prop !== 'open' })<{ open: boolean, sidebarWidth: number }>`

  background: transparent;
  box-shadow: none;
  color: inherit;
  z-index: var(--z-index-appBar);
  transition: ${({ theme }) => theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  })};

  ${({ open, sidebarWidth, theme }) => open ? `
    margin-left: ${sidebarWidth}px;
    width: calc(100% - ${sidebarWidth}px);
    transition: ${theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen
  })};
  ` : ''}
`;

const Drawer = styled(MuiDrawer, { shouldForwardProp: prop => prop !== 'open' && prop !== 'sidebarWidth' })
  // @ts-ignore mixin isnt typesafe
  // eslint-disable-next-line no-unexpected-multiline
  <{ open: boolean, sidebarWidth: number }>(({ sidebarWidth, theme, open }) => ({
    width: sidebarWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme, sidebarWidth),
      '& .MuiDrawer-paper': openedMixin(theme, sidebarWidth)
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme)
    })
  }));

export const HeaderSpacer = styled.div`
  min-height: ${headerHeight}px;
`;

const LayoutContainer = styled.div`
  display: flex;
  height: 100%;
`;

interface PageLayoutProps {
  children: React.ReactNode;
  sidebar?: ((p: { closeSidebar: () => void }) => JSX.Element);
  sidebarWidth?: number;
}

function PageLayout ({ sidebarWidth = 300, children, sidebar: SidebarOverride }: PageLayoutProps) {

  const smallScreen = React.useMemo(() => isSmallScreen(), []);
  const [open, setOpen] = useLocalStorage('leftSidebar', !smallScreen);
  const { user } = useUser();

  const handleDrawerOpen = React.useCallback(() => {
    setOpen(true);
  }, []);

  const handleDrawerClose = React.useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <Head>
        <CurrentPageFavicon />
      </Head>
      <LayoutContainer>
        <FocalboardViewsProvider>
          <ThreadsProvider>
            <VotesProvider>
              <PageDialogProvider>
                <PageActionDisplayProvider>
                  <AppBar open={open} sidebarWidth={sidebarWidth} position='fixed'>
                    <Header
                      open={open}
                      openSidebar={handleDrawerOpen}
                    />
                  </AppBar>
                  <Drawer
                    sidebarWidth={sidebarWidth}
                    variant='permanent'
                    open={open}
                  >
                    {SidebarOverride
                      ? <SidebarOverride closeSidebar={handleDrawerClose} />
                      : <Sidebar closeSidebar={handleDrawerClose} favorites={user?.favorites || []} />}
                  </Drawer>
                  <PageContainer>
                    <HeaderSpacer />
                    {children}
                  </PageContainer>
                  <PageDialogGlobalModal />
                </PageActionDisplayProvider>
              </PageDialogProvider>
            </VotesProvider>
          </ThreadsProvider>

        </FocalboardViewsProvider>
      </LayoutContainer>
    </>
  );
}

export default PageLayout;
