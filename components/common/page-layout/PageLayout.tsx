import styled from '@emotion/styled';
import { Theme } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import Head from 'next/head';
import * as React from 'react';
import Header, { headerHeight } from './Header';
import Sidebar from './Sidebar';

const drawerWidth = 300;

const openedMixin = (theme: Theme) => ({
  marginRight: 0,
  width: drawerWidth,
  transition: theme.transitions.create(['marginRight', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen
  }),
  overflowX: 'hidden'
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

const AppBar = styled(MuiAppBar, { shouldForwardProp: (prop: string) => prop !== 'open' })
  // eslint-disable-next-line no-unexpected-multiline
  <{ open: boolean }>(({ theme, open }) => ({
    background: 'transparent',
    boxShadow: 'none',
    color: 'inherit',
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    ...(open && {
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    })
  }));

const Drawer = styled(MuiDrawer, { shouldForwardProp: prop => prop !== 'open' })
  // @ts-ignore mixins dont work with Typescript
  // eslint-disable-next-line no-unexpected-multiline
  <{ open: boolean }>(({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme)
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme)
    })
  }));

const HeaderSpacer = styled.div`
  min-height: ${headerHeight}px;
`;

export function PageContainer ({ children }: { children: React.ReactNode }) {
  return (
    <Box component='main' height='100%' sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
      {children}
    </Box>
  );
}

export function PageLayout ({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);
  const [user] = useUser();
  const { currentPageId, pages } = usePages();
  const currentPage = pages[currentPageId];

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Head>
        {currentPage?.icon
          ? <link rel='icon' type='image/svg+xml' href={`data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${currentPage?.icon || ''}</text></svg>`} />
          : <link rel='icon' type='image/png' href='/favicon.png' />}
      </Head>
      <Box sx={{ display: 'flex', height: '100%' }}>
        <AppBar position='fixed' open={open}>
          <Header open={open} openSidebar={handleDrawerOpen} />
        </AppBar>
        <Drawer variant='permanent' open={open}>
          <Sidebar closeSidebar={handleDrawerClose} favorites={user?.favorites || []} />
        </Drawer>
        <PageContainer>
          <HeaderSpacer />
          {children}
        </PageContainer>
      </Box>
    </>
  );
}
