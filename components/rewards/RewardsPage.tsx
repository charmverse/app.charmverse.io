import { stringUtils } from '@charmverse/core/utilities';
import { Box, Divider, Grid, Stack, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import charmClient from 'charmClient';
import { ViewSortControl } from 'components/common/BoardEditor/components/ViewSortControl';
import Table from 'components/common/BoardEditor/focalboard/src/components/table/table';
import ViewHeaderActionsMenu from 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewHeaderActionsMenu';
import ViewSidebar from 'components/common/BoardEditor/focalboard/src/components/viewSidebar/viewSidebar';
import { EmptyStateVideo } from 'components/common/EmptyStateVideo';
import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import {
  DatabaseContainer,
  DatabaseTitle,
  DatabaseStickyHeader
} from 'components/common/PageLayout/components/DatabasePageContent';
import { NewRewardButton } from 'components/rewards/components/NewRewardButton';
import { useRewardsBoardMutator } from 'components/rewards/components/RewardsBoard/hooks/useRewardsBoardMutator';
import { useRewardsBoard } from 'components/rewards/hooks/useRewardsBoard';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useHasMemberLevel } from 'hooks/useHasMemberLevel';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import type { Card, CardPage } from 'lib/focalboard/card';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import { RewardsViewOptions } from './components/RewardViewOptions';
import { useApplicationDialog } from './hooks/useApplicationDialog';
import { useRewards } from './hooks/useRewards';

export function RewardsPage({ title }: { title: string }) {
  const router = useRouter();
  const { currentApplicationId, showApplication, isOpen } = useApplicationDialog();

  const mounted = useRef(false);

  useEffect(() => {
    // Only auto-open application on initial render of the page
    if (router.query.applicationId && !currentApplicationId && mounted.current === false) {
      showApplication(router.query.applicationId as string);
    } else if (!currentApplicationId) {
      setUrlWithoutRerender(router.pathname, { applicationId: null });
    }
    mounted.current = true;
  }, [currentApplicationId]);

  const { space: currentSpace } = useCurrentSpace();

  const { isFreeSpace } = useIsFreeSpace();
  const { statusFilter, setStatusFilter, rewards } = useRewards();

  const loadingData = !rewards;
  const { hasAccess, isLoadingAccess } = useHasMemberLevel('member');
  const canSeeRewards = hasAccess || isFreeSpace || currentSpace?.publicBountyBoard === true;

  const isAdmin = useIsAdmin();
  const { showPage: showReward, hidePage: hideReward } = usePageDialog();
  const { board: activeBoard, views, cardPages, activeView, cards } = useRewardsBoard();

  const [showSidebar, setShowSidebar] = useState(false);
  const viewSortPopup = usePopupState({ variant: 'popover', popupId: 'view-sort' });

  const groupByProperty = useMemo(() => {
    let _groupByProperty = activeBoard?.fields.cardProperties.find((o) => o.id === activeView?.fields.groupById);

    if ((!_groupByProperty || _groupByProperty?.type !== 'select') && activeView?.fields.viewType === 'board') {
      _groupByProperty = activeBoard?.fields.cardProperties.find((o: any) => o.type === 'select');
    }

    return _groupByProperty;
  }, [activeBoard?.fields.cardProperties, activeView?.fields.groupById, activeView?.fields.viewType]);

  useRewardsBoardMutator();

  function onClose() {
    setUrlWithoutRerender(router.pathname, { id: null });
    hideReward();
  }

  function openPage(pageId: string | null) {
    if (!pageId) return;

    setUrlWithoutRerender(router.pathname, { id: pageId });
    showReward({
      pageId,
      onClose
    });
  }

  const onDelete = useCallback(async (rewardId: string) => {
    await charmClient.deletePage(rewardId);
  }, []);

  useEffect(() => {
    const rewardIdFromUrl = router.query.bountyId ?? router.query.id;
    if (rewardIdFromUrl && stringUtils.isUUID(rewardIdFromUrl as string)) {
      showReward({
        pageId: rewardIdFromUrl as string,
        onClose
      });
    }
  }, [router.query.id, router.query.bountyId]);

  const showRewardOrApplication = useCallback(
    (id: string | null, rewardId?: string) => {
      if (id && (!rewardId || id === rewardId)) {
        openPage(id);
      } else if (id) {
        setUrlWithoutRerender(router.pathname, { applicationId: id });
        showApplication(id);
      }
    },
    [showReward]
  );

  if (isLoadingAccess) {
    return null;
  }

  if (!canSeeRewards) {
    return <ErrorPage message='You cannot access rewards for this space' />;
  }

  return (
    <DatabaseContainer>
      <DatabaseStickyHeader>
        <DatabaseTitle>
          <Box display='flex' alignItems='flex-start' justifyContent='space-between'>
            <Typography variant='h1' gutterBottom>
              {title}
            </Typography>

            <Box display='flex'>
              <Box
                gap={3}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  flexDirection: 'row-reverse'
                }}
              >
                <NewRewardButton />
              </Box>
            </Box>
          </Box>
        </DatabaseTitle>
        {!!rewards?.length && (
          <>
            <Stack direction='row' alignItems='center' justifyContent='flex-end' mb={1} gap={1}>
              <RewardsViewOptions
                rewardStatusFilter={statusFilter}
                setRewardStatusFilter={setStatusFilter}
                // Playwright-specific
                testKey='desktop'
              />

              <ViewSortControl
                activeBoard={activeBoard}
                activeView={activeView}
                cards={cards as Card[]}
                viewSortPopup={viewSortPopup}
              />

              <ViewHeaderActionsMenu
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSidebar(!showSidebar);
                }}
              />
            </Stack>
            <Divider />
          </>
        )}
      </DatabaseStickyHeader>

      {loadingData ? (
        <Grid item xs={12} sx={{ mt: 12 }}>
          <LoadingComponent height={500} isLoading size={50} />
        </Grid>
      ) : (
        <>
          {rewards?.length === 0 && (
            <Grid item xs={12} position='relative'>
              <Box sx={{ mt: 5 }}>
                <EmptyStateVideo
                  description='Getting started with rewards'
                  videoTitle='Rewards | Getting started with CharmVerse'
                  videoUrl='https://tiny.charmverse.io/bounties'
                />
              </Box>
            </Grid>
          )}
          {rewards?.length > 0 && (
            <Box className={`container-container ${showSidebar ? 'sidebar-visible' : ''}`}>
              <Stack>
                <Box width='100%'>
                  <Table
                    board={activeBoard}
                    activeView={activeView}
                    cardPages={cardPages as CardPage[]}
                    groupByProperty={groupByProperty}
                    views={views}
                    visibleGroups={[]}
                    selectedCardIds={[]}
                    readOnly={!isAdmin}
                    disableAddingCards={true}
                    showCard={showRewardOrApplication}
                    readOnlyTitle={true}
                    cardIdToFocusOnRender=''
                    addCard={async () => {}}
                    onCardClicked={() => {}}
                    onDeleteCard={onDelete}
                    expandSubRowsOnLoad
                  />
                </Box>

                <ViewSidebar
                  views={views}
                  board={activeBoard}
                  rootBoard={activeBoard}
                  view={activeView}
                  isOpen={!!showSidebar}
                  closeSidebar={() => setShowSidebar(false)}
                  hideLayoutOptions={true}
                  hideSourceOptions={true}
                  hideGroupOptions={true}
                  groupByProperty={groupByProperty}
                  page={undefined}
                  pageId={undefined}
                  showView={() => {}}
                />
              </Stack>
            </Box>
          )}
        </>
      )}
    </DatabaseContainer>
  );
}
