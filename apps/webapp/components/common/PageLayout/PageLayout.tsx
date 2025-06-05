import { styled, Box } from '@mui/material';
import Head from 'next/head';
import type { ReactNode } from 'react';

import { PageSidebarProvider, usePageSidebar } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import LoadingComponent from 'components/common/LoadingComponent';
import { PageDialogGlobal } from 'components/common/PageDialog/PageDialogGlobal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSharedPage } from 'hooks/useSharedPage';
import { useUser } from 'hooks/useUser';

import { AnnouncementBanner } from './components/AnnouncementBanner';
import { AppBar } from './components/AppBar';
import { BlocksExceededBanner } from './components/BlocksExceededBanner';
import { CurrentPageFavicon } from './components/CurrentPageFavicon';
import { Header, HeaderSpacer } from './components/Header/Header';
import { LayoutProviders } from './components/LayoutProviders';
import PageContainer from './components/PageContainer';
import { useNavigationSidebar } from './components/Sidebar/hooks/useNavigationSidebar';
import { NavigationSidebarDrawer } from './components/Sidebar/NavigationSidebarDrawer';
import { SharedPageLayout } from './SharedPageLayout';

const LayoutContainer = styled('div')`
  display: flex;
  height: 100%;
`;

interface PageLayoutProps {
  children: ReactNode;
}

const whitelistedDomains = ['ef', 'ethrangers', 'blockdag-grants'];

function PageLayout({ children }: PageLayoutProps) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { space, isLoading: isSpacesLoading } = useCurrentSpace();
  const { activeView: rightSidebarOpen, closeSidebar: closeRightSidebar } = usePageSidebar();

  const isFreeTierSpace = space?.paidTier === 'free';
  const isEnterpriseTierSpace = space?.paidTier === 'enterprise';
  const enableSidebar = !!user || isFreeTierSpace;

  const showSpaceMemberView = !!space && !!user && !!user?.spaceRoles.some((sr) => sr.spaceId === space.id);

  const { accessChecked, publicPage } = useSharedPage();

  const sidebarProps = useNavigationSidebar({
    enabled: enableSidebar
  });
  const {
    open,
    enableResize,
    isResizing,
    sidebarWidth,
    handleDrawerOpen,
    handleDrawerClose: closeLeftSidebar
  } = sidebarProps;
  // do not show navigation sidebar when the workflow sidebar is open
  const workflowSidebarOpen = rightSidebarOpen === 'proposal_evaluation' || rightSidebarOpen === 'reward_evaluation';
  const leftSidebarOpen = open && !workflowSidebarOpen;
  const { openSettings } = useSettingsDialog();

  // open left sidebar and close right sidebar if it is open
  function openLeftSidebar() {
    closeRightSidebar();
    handleDrawerOpen();
  }

  // skip access check if space is free tier, since accessChecked becomes false between each page transition
  if (!(accessChecked || isFreeTierSpace) || !isUserLoaded || isSpacesLoading) {
    return (
      <Box display='flex' height='100%' alignSelf='stretch' justifyContent='center' flex={1}>
        <LoadingComponent isLoading />
      </Box>
    );
  }

  if (!showSpaceMemberView) {
    return (
      <SharedPageLayout
        basePageId={publicPage?.page?.id}
        basePageType={publicPage?.page?.type}
        enableSidebar={enableSidebar}
        sidebarProps={{
          ...sidebarProps,
          handleDrawerOpen: openLeftSidebar,
          open: leftSidebarOpen
        }}
      >
        {children || null}
      </SharedPageLayout>
    );
  }

  return (
    <LayoutProviders>
      <Head>
        <CurrentPageFavicon />
      </Head>
      <LayoutContainer data-test='space-page-layout' className='app-content'>
        {leftSidebarOpen !== null && (
          <>
            <AppBar open={leftSidebarOpen} sidebarWidth={sidebarWidth} position='fixed'>
              <Header open={leftSidebarOpen} openSidebar={openLeftSidebar} />
              <BlocksExceededBanner />
            </AppBar>
            <NavigationSidebarDrawer
              enabled={enableSidebar}
              enableResizing={!!user}
              enableSpaceFeatures={true}
              enableResize={enableResize}
              isResizing={isResizing}
              open={leftSidebarOpen}
              width={sidebarWidth}
              closeSidebar={closeLeftSidebar}
            />
          </>
        )}
        <PageContainer>
          <HeaderSpacer />
          {children}
          <PageDialogGlobal />
        </PageContainer>
      </LayoutContainer>
    </LayoutProviders>
  );
}

function PageLayoutWithSidebarContext(props: PageLayoutProps) {
  return (
    <PageSidebarProvider>
      <PageLayout {...props} />
    </PageSidebarProvider>
  );
}

export default PageLayoutWithSidebarContext;
