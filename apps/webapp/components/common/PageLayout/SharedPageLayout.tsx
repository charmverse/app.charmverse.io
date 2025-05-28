import type { PageType } from '@charmverse/core/prisma';
import { styled } from '@mui/material';
import ArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box } from '@mui/material';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { PageDialogGlobal } from 'components/common/PageDialog/PageDialogGlobal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useSharedPage } from 'hooks/useSharedPage';
import { useUser } from 'hooks/useUser';

import { AppBar } from './components/AppBar';
import { CurrentPageFavicon } from './components/CurrentPageFavicon';
import { PageTitleWithBreadcrumbs } from './components/Header/components/PageTitleWithBreadcrumbs';
import { HeaderSpacer, StyledToolbar, ToggleSidebarIcon } from './components/Header/Header';
import { LayoutProviders } from './components/LayoutProviders';
import { LoggedOutButtons } from './components/LoggedOutButtons';
import PageContainer from './components/PageContainer';
import type { useNavigationSidebar } from './components/Sidebar/hooks/useNavigationSidebar';
import { NavigationSidebarDrawer } from './components/Sidebar/NavigationSidebarDrawer';

const LayoutContainer = styled.div`
  display: flex;
  height: 100%;
`;

type Props = {
  children: React.ReactNode;
  basePageId?: string;
  basePageType?: PageType;
  enableSidebar: boolean;
  sidebarProps: ReturnType<typeof useNavigationSidebar>;
};

// We could update this component in future to support other invite types
function JoinSpaceWithPublicProposals() {
  const { isSpaceMember } = useIsSpaceMember();
  const { space: currentSpace } = useCurrentSpace();
  const router = useRouter();

  const { data: publicInviteLink } = useSWR(
    !isSpaceMember && currentSpace ? `space-public-invite-${currentSpace.id}` : null,
    () =>
      charmClient.getPublicInviteLink({
        spaceId: currentSpace!.id,
        visibleOn: 'proposals'
      })
  );

  if (isSpaceMember || !publicInviteLink) {
    return null;
  }

  return (
    <Button onClick={() => router.push(`/invite/${publicInviteLink.code}`)} variant='text'>
      Join this space to create a proposal
    </Button>
  );
}

export function SharedPageLayout({ children, basePageId, basePageType, enableSidebar, sidebarProps }: Props) {
  const isMobile = useSmallScreen();
  const { publicPageType } = useSharedPage();
  const { user } = useUser();

  const {
    open: leftSidebarOpen,
    enableResize,
    isResizing,
    sidebarWidth,
    handleDrawerOpen,
    handleDrawerClose
  } = sidebarProps;

  return (
    <LayoutProviders>
      <Head>
        <CurrentPageFavicon />
      </Head>
      <LayoutContainer data-test='public-page-layout' className='app-content'>
        {leftSidebarOpen !== null && (
          <>
            <AppBar open={leftSidebarOpen} sidebarWidth={sidebarWidth} position='fixed'>
              <StyledToolbar variant='dense'>
                <ToggleSidebarIcon open={leftSidebarOpen} openSidebar={handleDrawerOpen} />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                    width: '100%'
                  }}
                >
                  {!isMobile ? (
                    <Box display='flex' alignItems='center' gap={6}>
                      <PageTitleWithBreadcrumbs pageId={basePageId} pageType={basePageType} />

                      {publicPageType === 'proposals' && <JoinSpaceWithPublicProposals />}
                    </Box>
                  ) : (
                    <PageTitleWithBreadcrumbs pageId={basePageId} pageType={basePageType} />
                  )}

                  <Box>
                    {user && (
                      <Button
                        endIcon={<ArrowRightIcon />}
                        variant='text'
                        color='inherit'
                        href='/'
                        external // avoid space domain being added
                      >
                        Go to my space
                      </Button>
                    )}
                    {!user && <LoggedOutButtons />}
                  </Box>
                </Box>
              </StyledToolbar>
              {isMobile && publicPageType === 'proposals' && (
                <Box sx={{ width: '100%', ml: 1 }}>
                  <JoinSpaceWithPublicProposals />
                </Box>
              )}
            </AppBar>
            <NavigationSidebarDrawer
              enabled={enableSidebar}
              {...sidebarProps}
              enableResizing={!!user}
              enableSpaceFeatures={false}
              enableResize={enableResize}
              isResizing={isResizing}
              open={leftSidebarOpen}
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
