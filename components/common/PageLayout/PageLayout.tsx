import styled from '@emotion/styled';
import { Theme } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import Head from 'next/head';
import * as React from 'react';
import Header, { headerHeight } from './components/Header';
import Sidebar from './components/Sidebar';
import Favicon from './components/Favicon';
import PageContainer from './components/PageContainer';

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

export default function PageLayout ({ children }: { children: React.ReactNode }) {
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
        <Favicon pageIcon={currentPage?.icon} />
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
