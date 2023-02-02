import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import { Tooltip, Box } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import MuiDrawer from '@mui/material/Drawer';
import Head from 'next/head';
import * as React from 'react';
import { useMemo, useState } from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import PageDialogGlobalModal from 'components/common/PageDialog/PageDialogGlobal';
import { SharedPageLayout } from 'components/common/PageLayout/SharedPageLayout';
import { FocalboardViewsProvider } from 'hooks/useFocalboardViews';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { useMobileSidebar } from 'hooks/useMobileSidebar';
import { PageActionDisplayProvider } from 'hooks/usePageActionDisplay';
import { useResize } from 'hooks/useResize';
import { useSharedPage } from 'hooks/useSharedPage';
import { ThreadsProvider } from 'hooks/useThreads';
import { useUser } from 'hooks/useUser';
import { VotesProvider } from 'hooks/useVotes';
import { useWindowSize } from 'hooks/useWindowSize';

import CurrentPageFavicon from './components/CurrentPageFavicon';
import Header, { headerHeight } from './components/Header';
import PageContainer from './components/PageContainer';
import Sidebar from './components/Sidebar';

const MAX_SIDEBAR_WIDTH = 500;
const MIN_SIDEBAR_WIDTH = 200;

const openedMixin = (theme: Theme, sidebarWidth: number) => ({
  maxWidth: '100%',
  width: sidebarWidth,
  transition: theme.transitions.create(['width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen
  }),
  overflowX: 'hidden',
  border: 'none'
});

const closedMixin = (theme: Theme) =>
  ({
    transition: theme.transitions.create(['width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    overflowX: 'hidden',
    width: 0,
    border: 'none'
  } as const);

export const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop: string) => prop !== 'sidebarWidth' && prop !== 'open'
})<{ open: boolean; sidebarWidth: number }>`
  background: transparent;
  box-shadow: none;
  color: inherit;
  z-index: var(--z-index-appBar);
  transition: ${({ theme }) =>
    theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })};

  ${({ open, sidebarWidth, theme }) =>
    open
      ? `
    margin-left: ${sidebarWidth}px;
    width: calc(100% - ${sidebarWidth}px);
    transition: ${theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })};
  `
      : ''}
`;

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'sidebarWidth'
})<{ open: boolean; sidebarWidth: number }>(
  // eslint-disable-next-line no-unexpected-multiline
  // @ts-ignore mixin isnt typesafe
  ({ sidebarWidth, theme, open }) => ({
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
    }),
    paddingRight: 3
  })
);

export const HeaderSpacer = styled.div`
  min-height: ${headerHeight}px;
`;

const LayoutContainer = styled.div`
  display: flex;
  height: 100%;
`;

const DraggableHandle = styled.div<{ isActive?: boolean; disabled?: boolean }>`
  position: absolute;
  width: 5px;
  bottom: 0;
  top: 0;
  right: 0;
  border-right: 1px solid ${({ theme }) => theme.palette.divider};
  transition: all 0.2s ease-in-out;
  background: transparent;

  ${({ disabled, theme }) =>
    !disabled &&
    `&:hover {
        border-right: 3px solid ${theme.palette.primary.main}
        }
      cursor: col-resize;
    `}

  ${({ isActive, theme }) => (isActive ? `border-right: 3px solid ${theme.palette.primary.main}` : '')}
`;

interface PageLayoutProps {
  children: React.ReactNode;
}

function PageLayout({ children }: PageLayoutProps) {
  const { width } = useWindowSize();
  const isMobileSidebar = useMobileSidebar();

  const mobileSidebarWidth = width ? Math.min(width * 0.85, MAX_SIDEBAR_WIDTH) : 0;

  const [storageOpen, setStorageOpen] = useLocalStorage('leftSidebar', !isMobileSidebar);
  const [sidebarStorageWidth, setSidebarStorageWidth] = useLocalStorage('leftSidebarWidth', 300);
  const [mobileOpen, setMobileOpen] = useState(false);

  const {
    width: resizableSidebarWidth,
    enableResize,
    isResizing
  } = useResize({
    initialWidth: sidebarStorageWidth,
    minWidth: MIN_SIDEBAR_WIDTH,
    maxWidth: MAX_SIDEBAR_WIDTH,
    onResize: setSidebarStorageWidth
  });
  const { user } = useUser();
  const { hasSharedPageAccess, accessChecked, publicPage } = useSharedPage();
  const open = isMobileSidebar ? mobileOpen : storageOpen;

  let displaySidebarWidth = resizableSidebarWidth;
  if (isMobileSidebar || !user) {
    displaySidebarWidth = 0;
  }

  const handleDrawerOpen = React.useCallback(() => {
    if (isMobileSidebar) {
      setMobileOpen(true);
    } else {
      setStorageOpen(true);
    }
  }, [isMobileSidebar]);

  const handleDrawerClose = React.useCallback(() => {
    if (isMobileSidebar) {
      setMobileOpen(false);
    } else {
      setStorageOpen(false);
    }
  }, [isMobileSidebar]);

  const drawerContent = useMemo(
    () =>
      !user ? (
        <div></div>
      ) : (
        <Sidebar
          closeSidebar={handleDrawerClose}
          favorites={user?.favorites || []}
          navAction={isMobileSidebar ? handleDrawerClose : undefined}
        />
      ),
    [handleDrawerClose, !!user, isMobileSidebar]
  );

  if (!accessChecked) {
    return (
      <Box display='flex' height='100%' alignSelf='stretch' justifyContent='center' flex={1}>
        <LoadingComponent isLoading />
      </Box>
    );
  }

  if (hasSharedPageAccess) {
    return <SharedPageLayout basePageId={publicPage?.page?.id}>{children || null}</SharedPageLayout>;
  }

  return (
    <>
      <Head>
        <CurrentPageFavicon />
      </Head>
      <LayoutContainer data-test='space-page-layout'>
        <FocalboardViewsProvider>
          <ThreadsProvider>
            <VotesProvider>
              <PageDialogProvider>
                <PageActionDisplayProvider>
                  {open !== null && (
                    <>
                      <AppBar open={open} sidebarWidth={displaySidebarWidth} position='fixed'>
                        <Header open={open} openSidebar={handleDrawerOpen} />
                      </AppBar>
                      {isMobileSidebar ? (
                        <MuiDrawer
                          open={open}
                          variant='temporary'
                          onClose={handleDrawerClose}
                          ModalProps={{
                            keepMounted: true
                          }}
                        >
                          <Box width={mobileSidebarWidth} minHeight='100vh'>
                            {drawerContent}
                          </Box>
                        </MuiDrawer>
                      ) : (
                        <Drawer sidebarWidth={displaySidebarWidth} open={open} variant='permanent'>
                          {drawerContent}
                          <Tooltip title={!user || isResizing ? '' : 'Drag to resize'} placement='right' followCursor>
                            <DraggableHandle
                              onMouseDown={(e) => enableResize(e)}
                              isActive={isResizing}
                              disabled={!user}
                            />
                          </Tooltip>
                        </Drawer>
                      )}
                    </>
                  )}
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
