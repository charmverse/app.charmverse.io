import styled from '@emotion/styled';
import { Theme } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import MuiDrawer from '@mui/material/Drawer';
import { useUser } from 'hooks/useUser';
import Head from 'next/head';
import * as React from 'react';
import { PageActionDisplayProvider } from 'hooks/usePageActionDisplay';
import { ThreadsProvider } from 'hooks/useThreads';
import { InlineVotesProvider } from 'hooks/useInlineVotes';
import Header, { headerHeight } from './components/Header';
import Sidebar from './components/Sidebar';
import PageContainer from './components/PageContainer';
import CurrentPageFavicon from './components/CurrentPageFavicon';

const openedMixin = (theme: Theme, sidebarWidth: number) => ({
  width: '100%',
  marginRight: 0,
  transition: theme.transitions.create(['marginRight', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen
  }),
  overflowX: 'hidden',
  [theme.breakpoints.up('sm')]: {
    width: sidebarWidth
  }
});

const closedMixin = (theme: Theme) => ({
  transition: theme.transitions.create(['marginRight', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  overflowX: 'hidden',
  marginRight: 60,
  width: 0
});

export const AppBar = styled(MuiAppBar, { shouldForwardProp: (prop: string) => prop !== 'sidebarWidth' && prop !== 'open' })
  // eslint-disable-next-line no-unexpected-multiline
  <{ open: boolean, sidebarWidth: number }>(({ sidebarWidth, theme, open }) => ({
    background: 'transparent',
    boxShadow: 'none',
    color: 'inherit',
    zIndex: 'var(--z-index-appBar)',
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    ...(open && {
      marginLeft: sidebarWidth,
      width: `calc(100% - ${sidebarWidth}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    })
  }));

const Drawer = styled(MuiDrawer, { shouldForwardProp: prop => prop !== 'open' && prop !== 'sidebarWidth' && prop !== 'hideSidebarOnSmallScreen' })
  // @ts-ignore mixins dont work with Typescript
  // eslint-disable-next-line no-unexpected-multiline
  <{ open: BooleanSchema, sidebarWidth: number }>(({ sidebarWidth, theme, open }) => ({
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
          <InlineVotesProvider>
            <PageActionDisplayProvider>
              <AppBar sidebarWidth={sidebarWidth} position='fixed' open={open}>
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
          </InlineVotesProvider>
        </ThreadsProvider>
      </LayoutContainer>
    </>
  );
}

export default PageLayout;
