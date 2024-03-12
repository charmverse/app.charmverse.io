import type { PageType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import ArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box } from '@mui/material';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { DocumentPageProviders } from 'components/[pageId]/DocumentPage/DocumentPageProviders';
import { Button } from 'components/common/Button';
import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import { PageDialogGlobal } from 'components/common/PageDialog/PageDialogGlobal';
import { AppBar } from 'components/common/PageLayout/components/AppBar';
import CurrentPageFavicon from 'components/common/PageLayout/components/CurrentPageFavicon';
import { PageTitleWithBreadcrumbs } from 'components/common/PageLayout/components/Header/components/PageTitleWithBreadcrumbs';
import { HeaderSpacer, StyledToolbar } from 'components/common/PageLayout/components/Header/Header';
import PageContainer from 'components/common/PageLayout/components/PageContainer';
import { RewardBlocksProvider } from 'components/rewards/hooks/useRewardBlocks';
import { RewardsBoardProvider } from 'components/rewards/hooks/useRewardsBoardAndBlocks';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { ProposalBlocksProvider } from 'hooks/useProposalBlocks';
import { useSharedPage } from 'hooks/useSharedPage';
import { useUser } from 'hooks/useUser';

import { LoggedOutButtons } from './components/LoggedOutButtons';

const LayoutContainer = styled.div`
  display: flex;
  height: 100%;
`;

type Props = {
  children: React.ReactNode;
  basePageId?: string;
  basePageType?: PageType;
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

export function SharedPageLayout({ children, basePageId, basePageType }: Props) {
  const isMobile = useSmallScreen();
  const { publicPageType } = useSharedPage();
  const { user } = useUser();

  return (
    <ProposalBlocksProvider>
      <RewardBlocksProvider>
        <RewardsBoardProvider>
          <DocumentPageProviders>
            <Head>
              <CurrentPageFavicon />
            </Head>
            <LayoutContainer data-test='public-page-layout' className='app-content'>
              <AppBar sidebarWidth={0} position='fixed' open={false}>
                <StyledToolbar variant='dense'>
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

              <PageDialogProvider>
                <PageContainer>
                  <HeaderSpacer />
                  {children}
                  <PageDialogGlobal />
                </PageContainer>
              </PageDialogProvider>
            </LayoutContainer>
          </DocumentPageProviders>
        </RewardsBoardProvider>
      </RewardBlocksProvider>
    </ProposalBlocksProvider>
  );
}
