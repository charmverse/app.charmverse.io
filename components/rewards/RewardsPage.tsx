import { Box, Divider, Grid, Stack, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useCallback, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import { ViewFilterControl } from 'components/common/BoardEditor/components/ViewFilterControl';
import { ViewSettingsRow } from 'components/common/BoardEditor/components/ViewSettingsRow';
import { ViewSortControl } from 'components/common/BoardEditor/components/ViewSortControl';
import Table from 'components/common/BoardEditor/focalboard/src/components/table/table';
import ViewHeaderActionsMenu from 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewHeaderActionsMenu';
import ViewSidebar from 'components/common/BoardEditor/focalboard/src/components/viewSidebar/viewSidebar';
import { EmptyStateVideo } from 'components/common/EmptyStateVideo';
import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import {
  DatabaseContainer,
  DatabaseStickyHeader,
  DatabaseTitle
} from 'components/common/PageLayout/components/DatabasePageContent';
import { NewRewardButton } from 'components/rewards/components/NewRewardButton';
import { useRewardsBoardMutator } from 'components/rewards/components/RewardsBoard/hooks/useRewardsBoardMutator';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewardsBoard } from 'components/rewards/hooks/useRewardsBoard';
import { useRewardsNavigation } from 'components/rewards/hooks/useRewardsNavigation';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useHasMemberLevel } from 'hooks/useHasMemberLevel';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import type { Card, CardPage } from 'lib/focalboard/card';

import { useRewards } from './hooks/useRewards';

export function RewardsPage({ title }: { title: string }) {
  useRewardsNavigation();

  const { space: currentSpace } = useCurrentSpace();
  const { updateURLQuery, navigateToSpacePath } = useCharmRouter();
  const { isFreeSpace } = useIsFreeSpace();
  const { rewards, isLoading: loadingData } = useRewards();

  const { hasAccess, isLoadingAccess } = useHasMemberLevel('member');
  const canSeeRewards = hasAccess || isFreeSpace || currentSpace?.publicBountyBoard === true;
  const { getRewardPage } = useRewardPage();

  const isAdmin = useIsAdmin();

  const { board: activeBoard, views, cardPages, activeView, cards } = useRewardsBoard();

  const [showSidebar, setShowSidebar] = useState(false);
  const viewSortPopup = usePopupState({ variant: 'popover', popupId: 'view-sort' });
  const viewFilterPopup = usePopupState({ variant: 'popover', popupId: 'view-sort' });

  const groupByProperty = useMemo(() => {
    let _groupByProperty = activeBoard?.fields.cardProperties.find((o) => o.id === activeView?.fields.groupById);

    if ((!_groupByProperty || _groupByProperty?.type !== 'select') && activeView?.fields.viewType === 'board') {
      _groupByProperty = activeBoard?.fields.cardProperties.find((o: any) => o.type === 'select');
    }

    return _groupByProperty;
  }, [activeBoard?.fields.cardProperties, activeView?.fields.groupById, activeView?.fields.viewType]);

  useRewardsBoardMutator();

  const openPageIn = activeView?.fields.openPageIn ?? 'center_peek';

  function openPage(rewardId: string | null) {
    if (!rewardId) return;

    const pageId = getRewardPage(rewardId)?.id || rewardId;

    if (openPageIn === 'center_peek') {
      updateURLQuery({ id: pageId });
    } else if (openPageIn === 'full_page') {
      navigateToSpacePath(`/${pageId}`);
    }
  }

  const onDelete = useCallback(async (rewardId: string) => {
    await charmClient.deletePage(rewardId);
  }, []);

  const showRewardOrApplication = (id: string | null, rewardId?: string) => {
    if (id && (!rewardId || id === rewardId)) {
      openPage(id);
    } else if (id) {
      if (openPageIn === 'center_peek') {
        updateURLQuery({ applicationId: id });
      } else if (openPageIn === 'full_page') {
        navigateToSpacePath(`/rewards/applications/${id}`);
      }
    }
  };

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
                <NewRewardButton showPage={openPage} />
              </Box>
            </Box>
          </Box>
        </DatabaseTitle>
        <>
          <Stack direction='row' alignItems='center' justifyContent='flex-end' mb={1} gap={1}>
            <ViewFilterControl viewFilterPopup={viewFilterPopup} activeBoard={activeBoard} activeView={activeView} />

            <ViewSortControl
              activeBoard={activeBoard}
              activeView={activeView}
              cards={cards as Card[]}
              viewSortPopup={viewSortPopup}
            />

            {isAdmin && (
              <ViewHeaderActionsMenu
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSidebar(!showSidebar);
                }}
              />
            )}
          </Stack>
          <Divider />

          <ViewSettingsRow activeView={activeView} canSaveGlobally={isAdmin} />
        </>
      </DatabaseStickyHeader>

      {loadingData ? (
        <Grid item xs={12} sx={{ mt: 12 }}>
          <LoadingComponent height={500} isLoading size={50} />
        </Grid>
      ) : (
        <Box className={`container-container ${showSidebar ? 'sidebar-visible' : ''}`}>
          <Stack>
            {rewards && rewards?.length > 0 ? (
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
                  disableAddingCards
                  showCard={showRewardOrApplication}
                  readOnlyTitle
                  cardIdToFocusOnRender=''
                  addCard={async () => {}}
                  onCardClicked={() => {}}
                  onDeleteCard={onDelete}
                  expandSubRowsOnLoad
                />
              </Box>
            ) : (
              <Box sx={{ mt: 3 }}>
                <EmptyStateVideo
                  description='Getting started with rewards'
                  videoTitle='Rewards | Getting started with CharmVerse'
                  videoUrl='https://tiny.charmverse.io/bounties'
                />
              </Box>
            )}

            {isAdmin && (
              <ViewSidebar
                views={views}
                board={activeBoard}
                rootBoard={activeBoard}
                view={activeView}
                isOpen={!!showSidebar}
                closeSidebar={() => setShowSidebar(false)}
                hideLayoutSelectOptions
                hideSourceOptions
                hideGroupOptions
                groupByProperty={groupByProperty}
                page={undefined}
                pageId={undefined}
                showView={() => {}}
              />
            )}
          </Stack>
        </Box>
      )}
    </DatabaseContainer>
  );
}
