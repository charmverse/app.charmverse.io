import styled from '@emotion/styled';
import { Box } from '@mui/material';
import Head from 'next/head';
import * as React from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import { PageDialogGlobal } from 'components/common/PageDialog/PageDialogGlobal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSharedPage } from 'hooks/useSharedPage';
import { useUser } from 'hooks/useUser';

import { AnnouncementBanner } from './components/AnnouncementBanner';
import { AppBar } from './components/AppBar';
import { BlocksExceededBanner } from './components/BlocksExceededBanner';
import CurrentPageFavicon from './components/CurrentPageFavicon';
import { Header, HeaderSpacer } from './components/Header/Header';
import { LayoutProviders } from './components/LayoutProviders';
import PageContainer from './components/PageContainer';
import { useNavigationSidebar } from './components/Sidebar/hooks/useNavigationSidebar';
import { NavigationSidebarDrawer } from './components/Sidebar/NavigationSidebarDrawer';
import { SharedPageLayout } from './SharedPageLayout';

const LayoutContainer = styled.div`
  display: flex;
  height: 100%;
`;

interface PageLayoutProps {
  children: React.ReactNode;
}

function PageLayout({ children }: PageLayoutProps) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { space, isLoading: isSpacesLoading } = useCurrentSpace();

  const isFreeTierSpace = space?.paidTier === 'free';
  const enableSidebar = !!user || isFreeTierSpace;

  const showSpaceMemberView = !!space && !!user && !!user?.spaceRoles.some((sr) => sr.spaceId === space.id);

  const { accessChecked, publicPage } = useSharedPage();

  const { open, enableResize, isResizing, sidebarWidth, handleDrawerOpen, handleDrawerClose } = useNavigationSidebar({
    enabled: enableSidebar
  });

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
        {open !== null && (
          <>
            <AppBar open={open} sidebarWidth={sidebarWidth} position='fixed'>
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
            <NavigationSidebarDrawer
              enabled={enableSidebar}
              enableResizing={!!user}
              enableSpaceFeatures={true}
              enableResize={enableResize}
              isResizing={isResizing}
              open={open}
              width={sidebarWidth}
              closeSidebar={handleDrawerClose}
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

export default PageLayout;
