import styled from '@emotion/styled';
import { Theme } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import MuiDrawer from '@mui/material/Drawer';
import { VotesProvider } from 'hooks/useVotes';
import { PageActionDisplayProvider } from 'hooks/usePageActionDisplay';
import { ThreadsProvider } from 'hooks/useThreads';
import { useUser } from 'hooks/useUser';
import Head from 'next/head';
import * as React from 'react';
import CurrentPageFavicon from './components/CurrentPageFavicon';
import Header, { headerHeight } from './components/Header';
import PageContainer from './components/PageContainer';
import Sidebar from './components/Sidebar';

const openedMixin = (theme: Theme, sidebarWidth: number) => ({
  width: '100%',
  transition: theme.transitions.create(['width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen
  }),
  overflowX: 'hidden',
  [theme.breakpoints.up('sm')]: {
    width: sidebarWidth
  }
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

const Drawer = styled(MuiDrawer, { shouldForwardProp: prop => prop !== 'open' && prop !== 'sidebarWidth' && prop !== 'hideSidebarOnSmallScreen' })
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
  sidebar?: ((p: { closeSidebar: () => void }) => JSX.Element)
  sidebarWidth?: number
  hideSidebarOnSmallScreen?: boolean
}

function PageLayout ({ hideSidebarOnSmallScreen = false, sidebarWidth = 300, children, sidebar: SidebarOverride }: PageLayoutProps) {
  const isSmallScreen = window.innerWidth < 600;
  const [open, setOpen] = React.useState(!isSmallScreen);
  const [user] = useUser();

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
        <ThreadsProvider>
          <VotesProvider>
            <PageActionDisplayProvider>
              <AppBar open={open} sidebarWidth={sidebarWidth} position='fixed'>
                <Header
                  open={open}
                  hideSidebarOnSmallScreen={hideSidebarOnSmallScreen}
                  openSidebar={handleDrawerOpen}
                />
              </AppBar>
              <Drawer
                sidebarWidth={sidebarWidth}
                variant='permanent'
                open={open}
                sx={{
                  display: {
                    xs: hideSidebarOnSmallScreen ? 'none' : 'block',
                    md: 'block'
                  }
                }}
              >
                {SidebarOverride
                  ? <SidebarOverride closeSidebar={handleDrawerClose} />
                  : <Sidebar closeSidebar={handleDrawerClose} favorites={user?.favorites || []} />}
              </Drawer>
              <PageContainer>
                <HeaderSpacer />
                {children}
              </PageContainer>
            </PageActionDisplayProvider>
          </VotesProvider>
        </ThreadsProvider>
      </LayoutContainer>
    </>
  );
}

function MobileLayout () {
  return (
    <>layout</>
  );
}

export default PageLayout;
