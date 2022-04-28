import styled from '@emotion/styled';
import { Theme } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import MuiDrawer from '@mui/material/Drawer';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import Head from 'next/head';
import * as React from 'react';
import { useThreads } from 'hooks/useThreads';
import { useSWRConfig } from 'swr';
import { ThreadWithComments } from 'pages/api/pages/[id]/threads';
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

interface IContext {
  showingCommentThreadsList: boolean,
  setShowingCommentThreadsList: React.Dispatch<React.SetStateAction<boolean>>
}
const CommentThreadsListDisplayContext = React.createContext<IContext>({
  setShowingCommentThreadsList: () => undefined,
  showingCommentThreadsList: false
});

const HeaderSpacer = styled.div`
  min-height: ${headerHeight}px;
`;

const LayoutContainer = styled.div`
  display: flex;
  height: 100%;
`;

function PageLayout ({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);
  const [user] = useUser();
  const { currentPageId } = usePages();
  const { isValidating } = useThreads();
  const [showingCommentThreadsList, setShowingCommentThreadsList] = React.useState(false);
  const { cache } = useSWRConfig();
  React.useEffect(() => {
    // For some reason we cant get the threads map using useThreads, its empty even after isValidating is true (data has loaded)
    const cachedData: ThreadWithComments[] | undefined = cache.get(`pages/${currentPageId}/threads`);
    if (cachedData) {
      setShowingCommentThreadsList(cachedData.filter(thread => thread && !thread.resolved).length > 0);
    }
  }, [isValidating, currentPageId]);

  const handleDrawerOpen = React.useCallback(() => {
    setOpen(true);
  }, []);

  const handleDrawerClose = React.useCallback(() => {
    setOpen(false);
  }, []);

  const value = React.useMemo<IContext>(() => ({
    showingCommentThreadsList,
    setShowingCommentThreadsList
  }), [showingCommentThreadsList]);

  return (
    <CommentThreadsListDisplayContext.Provider value={value}>
      <Head>
        <CurrentPageFavicon />
      </Head>
      <LayoutContainer>
        <AppBar position='fixed' open={open}>
          <Header
            open={open}
            openSidebar={handleDrawerOpen}
          />
        </AppBar>
        <Drawer variant='permanent' open={open}>
          <Sidebar closeSidebar={handleDrawerClose} favorites={user?.favorites || []} />
        </Drawer>
        <PageContainer>
          <HeaderSpacer />
          {children}
        </PageContainer>
      </LayoutContainer>
    </CommentThreadsListDisplayContext.Provider>
  );
}

export function useThreadsDisplay () {
  return React.useContext(CommentThreadsListDisplayContext);
}

function CurrentPageFavicon () {
  const { currentPageId, pages } = usePages();
  const currentPage = pages[currentPageId];
  return <Favicon pageIcon={currentPage?.icon} />;
}

export default PageLayout;
