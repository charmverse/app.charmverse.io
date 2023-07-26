import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import { Tooltip, Box, Typography } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import MuiDrawer from '@mui/material/Drawer';
import Head from 'next/head';
import * as React from 'react';
import { useMemo, useState } from 'react';

import { DocumentPageProviders } from 'components/[pageId]/DocumentPage/DocumentPageProviders';
import LoadingComponent from 'components/common/LoadingComponent';
import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import { SharedPageLayout } from 'components/common/PageLayout/SharedPageLayout';
import { useBlockCount } from 'components/settings/subscription/hooks/useBlockCount';
import { useSpaceSubscription } from 'components/settings/subscription/hooks/useSpaceSubscription';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { FocalboardViewsProvider } from 'hooks/useFocalboardViews';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useResize } from 'hooks/useResize';
import { useSharedPage } from 'hooks/useSharedPage';
import { useUser } from 'hooks/useUser';
import { useWindowSize } from 'hooks/useWindowSize';

import { AnnouncementBanner } from './components/AnnouncementBanner';
import CurrentPageFavicon from './components/CurrentPageFavicon';
import { Header, headerHeight } from './components/Header/Header';
import PageContainer from './components/PageContainer';
import { Sidebar } from './components/Sidebar/Sidebar';

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
  const isMobile = useSmallScreen();

  const mobileSidebarWidth = width ? Math.min(width * 0.85, MAX_SIDEBAR_WIDTH) : 0;

  const [storageOpen, setStorageOpen] = useLocalStorage('leftSidebar', !isMobile);
  const [sidebarStorageWidth, setSidebarStorageWidth] = useLocalStorage('leftSidebarWidth', 300);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = useIsAdmin();

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
  const { space } = useCurrentSpace();
  const { spaceSubscription } = useSpaceSubscription();
  const { blockCount } = useBlockCount();
  const showSpaceMemberView = !!space && !!user && !!user?.spaceRoles.some((sr) => sr.spaceId === space.id);

  const { accessChecked, publicPage } = useSharedPage();
  const open = isMobile ? mobileOpen : storageOpen;

  let displaySidebarWidth = resizableSidebarWidth;
  if (isMobile || !user) {
    displaySidebarWidth = 0;
  }

  const handleDrawerOpen = React.useCallback(() => {
    if (isMobile) {
      setMobileOpen(true);
    } else {
      setStorageOpen(true);
    }
  }, [isMobile]);

  const handleDrawerClose = React.useCallback(() => {
    if (isMobile) {
      setMobileOpen(false);
    } else {
      setStorageOpen(false);
    }
  }, [isMobile]);

  const drawerContent = useMemo(
    () =>
      !user ? (
        <div></div>
      ) : (
        <Sidebar closeSidebar={handleDrawerClose} navAction={isMobile ? handleDrawerClose : undefined} />
      ),
    [handleDrawerClose, !!user, isMobile]
  );

  const blockQuota = (spaceSubscription?.blockQuota || 0) * 1000;
  const passedBlockQuota = (blockCount?.count || 0) > blockQuota;

  if (!accessChecked) {
    return (
      <Box display='flex' height='100%' alignSelf='stretch' justifyContent='center' flex={1}>
        <LoadingComponent isLoading />
      </Box>
    );
  }

  if (!showSpaceMemberView) {
    return (
      <SharedPageLayout basePageId={publicPage?.page?.id} basePageType={publicPage?.page?.type}>
        {children || null}
      </SharedPageLayout>
    );
  }

  return (
    <>
      <Head>
        <CurrentPageFavicon />
      </Head>
      <LayoutContainer data-test='space-page-layout'>
        <FocalboardViewsProvider>
          <DocumentPageProviders>
            <PageDialogProvider>
              {open !== null && (
                <>
                  <AppBar open={open} sidebarWidth={displaySidebarWidth} position='fixed'>
                    <Header open={open} openSidebar={handleDrawerOpen} />
                    {/* {isAdmin && space?.paidTier === 'community' && <AnnouncementBanner spaceId={space.id}><Typography component='div'>Community Edition available. Upgrade now!</Typography></AnnouncementBanner>} */}
                    {spaceSubscription && passedBlockQuota && (
                      <AnnouncementBanner spaceId={space.id} showClose={false} errorBackground>
                        <Typography>
                          This space has passed the block limit of{' '}
                          <Typography component='span'>{blockQuota.toLocaleString()}</Typography>
                        </Typography>
                      </AnnouncementBanner>
                    )}
                  </AppBar>
                  {isMobile ? (
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
                        <DraggableHandle onMouseDown={(e) => enableResize(e)} isActive={isResizing} disabled={!user} />
                      </Tooltip>
                    </Drawer>
                  )}
                </>
              )}
              <PageContainer>
                <HeaderSpacer />
                {children}
              </PageContainer>
            </PageDialogProvider>
          </DocumentPageProviders>
        </FocalboardViewsProvider>
      </LayoutContainer>
    </>
  );
}

export default PageLayout;
