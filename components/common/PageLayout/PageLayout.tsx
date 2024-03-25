import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import { Tooltip, Box } from '@mui/material';
import MuiDrawer from '@mui/material/Drawer';
import Head from 'next/head';
import * as React from 'react';
import { useMemo, useState } from 'react';

import { DocumentPageProviders } from 'components/[pageId]/DocumentPage/DocumentPageProviders';
import LoadingComponent from 'components/common/LoadingComponent';
import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import { PageDialogGlobal } from 'components/common/PageDialog/PageDialogGlobal';
import { AnnouncementBanner } from 'components/common/PageLayout/components/AnnouncementBanner';
import { BlocksExceededBanner } from 'components/common/PageLayout/components/BlocksExceededBanner';
import { SharedPageLayout } from 'components/common/PageLayout/SharedPageLayout';
import { RewardBlocksProvider } from 'components/rewards/hooks/useRewardBlocks';
import { RewardsBoardProvider } from 'components/rewards/hooks/useRewardsBoardAndBlocks';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { DatabaseViewsProvider } from 'hooks/useDatabaseViews';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { ProposalBlocksProvider } from 'hooks/useProposalBlocks';
import { useResize } from 'hooks/useResize';
import { useSharedPage } from 'hooks/useSharedPage';
import { useUser } from 'hooks/useUser';
import { useWindowSize } from 'hooks/useWindowSize';

import { AppBar } from './components/AppBar';
import CurrentPageFavicon from './components/CurrentPageFavicon';
import { Header, HeaderSpacer } from './components/Header/Header';
import PageContainer from './components/PageContainer';
import { NavigationSidebar } from './components/Sidebar/NavigationSidebar';

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
  const { user, isLoaded: isUserLoaded } = useUser();
  const { space, isLoading: isSpacesLoading } = useCurrentSpace();

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
        <NavigationSidebar closeSidebar={handleDrawerClose} navAction={isMobile ? handleDrawerClose : undefined} />
      ),
    [handleDrawerClose, !!user, isMobile]
  );

  if (!accessChecked || !isUserLoaded || isSpacesLoading) {
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
      <LayoutContainer data-test='space-page-layout' className='app-content'>
        <DatabaseViewsProvider>
          <ProposalBlocksProvider>
            <RewardBlocksProvider>
              <RewardsBoardProvider>
                <DocumentPageProviders>
                  <PageDialogProvider>
                    {open !== null && (
                      <>
                        <AppBar open={open} sidebarWidth={displaySidebarWidth} position='fixed'>
                          <Header open={open} openSidebar={handleDrawerOpen} />
                          <BlocksExceededBanner />
                          <AnnouncementBanner
                            actionLabel='Check it out'
                            actionHref='https://tiny.charmverse.io/prop2-updates'
                            expiryDate='2024-01-07'
                          >
                            NEW governance & decision-making workflow launched.
                          </AnnouncementBanner>
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
                      <PageDialogGlobal />
                    </PageContainer>
                  </PageDialogProvider>
                </DocumentPageProviders>
              </RewardsBoardProvider>
            </RewardBlocksProvider>
          </ProposalBlocksProvider>
        </DatabaseViewsProvider>
      </LayoutContainer>
    </>
  );
}

export default PageLayout;
