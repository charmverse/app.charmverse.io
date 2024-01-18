import { Box, Divider, Grid, Stack, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';

import { useTrashPages } from 'charmClient/hooks/pages';
import { ViewFilterControl } from 'components/common/BoardEditor/components/ViewFilterControl';
import { ViewSettingsRow } from 'components/common/BoardEditor/components/ViewSettingsRow';
import { ViewSortControl } from 'components/common/BoardEditor/components/ViewSortControl';
import AddViewMenu from 'components/common/BoardEditor/focalboard/src/components/addViewMenu';
import { getVisibleAndHiddenGroups } from 'components/common/BoardEditor/focalboard/src/components/centerPanel';
import Kanban from 'components/common/BoardEditor/focalboard/src/components/kanban/kanban';
import Table from 'components/common/BoardEditor/focalboard/src/components/table/table';
import { ToggleViewSidebarButton } from 'components/common/BoardEditor/focalboard/src/components/viewHeader/ToggleViewSidebarButton';
import ViewHeaderDisplayByMenu from 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewHeaderDisplayByMenu';
import ViewTabs from 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewTabs';
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
import { viewTypeToBlockId } from 'lib/focalboard/customBlocks/constants';
import { DUE_DATE_ID } from 'lib/rewards/blocks/constants';
import { defaultRewardViews, supportedRewardViewTypes } from 'lib/rewards/blocks/views';

import { useRewards } from './hooks/useRewards';

const CalendarFullView = dynamic(
  () => import('../common/BoardEditor/focalboard/src/components/calendar/fullCalendar'),
  { ssr: false }
);

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

  const groupByProperty = useMemo(() => {
    let _groupByProperty = activeBoard?.fields.cardProperties.find((o) => o.id === activeView?.fields.groupById);

    if ((!_groupByProperty || _groupByProperty?.type !== 'select') && activeView?.fields.viewType === 'board') {
      _groupByProperty = activeBoard?.fields.cardProperties.find((o: any) => o.type === 'select');
    }

    return _groupByProperty;
  }, [activeBoard?.fields.cardProperties, activeView?.fields.groupById, activeView?.fields.viewType]);

  const { visible: visibleGroups, hidden: hiddenGroups } = activeView
    ? getVisibleAndHiddenGroups(
        cardPages as CardPage[],
        activeView.fields.visibleOptionIds,
        activeView.fields.hiddenOptionIds,
        groupByProperty
      )
    : { visible: [], hidden: [] };

  useRewardsBoardMutator();

  const openPageIn = activeView?.fields.openPageIn ?? 'center_peek';
  const withDisplayBy = activeView?.fields.viewType === 'calendar';

  const { trigger: trashPages } = useTrashPages();
  const dateDisplayProperty = useMemo(
    () =>
      activeBoard?.fields.cardProperties.find((o) => {
        // default calendar grouping to due date
        return o.id === (activeView?.fields.dateDisplayPropertyId || DUE_DATE_ID);
      }),
    [activeBoard?.fields.cardProperties, activeView?.fields.dateDisplayPropertyId]
  );

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
    await trashPages({ pageIds: [rewardId], trash: true });
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

  const showView = (boardViewId: string) => {
    const viewId = Object.entries(viewTypeToBlockId).find(([, blockId]) => blockId === boardViewId)?.[0] ?? boardViewId;
    if (viewId === activeView?.id) return;
    updateURLQuery({ viewId });
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
          <Stack direction='row' alignItems='center' justifyContent='space-between' gap={1}>
            <Stack mb={0.5} direction='row' alignItems='center'>
              <ViewTabs
                openViewOptions={() => setShowSidebar(true)}
                board={activeBoard}
                views={views}
                readOnly={!isAdmin}
                showView={showView}
                activeView={activeView}
                disableUpdatingUrl
                maxTabsShown={3}
                readOnlyViewIds={defaultRewardViews}
                supportedViewTypes={supportedRewardViewTypes}
              />

              {!!views.length && views.length <= 3 && (
                <Stack mb='-5px'>
                  <AddViewMenu
                    board={activeBoard}
                    activeView={activeView}
                    views={views}
                    showView={showView}
                    supportedViewTypes={supportedRewardViewTypes}
                  />
                </Stack>
              )}
            </Stack>

            <Stack direction='row' alignItems='center' mb={1} gap={0.5}>
              {withDisplayBy && (
                <ViewHeaderDisplayByMenu
                  properties={activeBoard?.fields.cardProperties ?? []}
                  activeView={activeView}
                  dateDisplayPropertyName={dateDisplayProperty?.name || '-'}
                />
              )}

              <ViewFilterControl activeBoard={activeBoard} activeView={activeView} />

              <ViewSortControl
                activeBoard={activeBoard}
                activeView={activeView}
                cards={cards as Card[]}
                viewSortPopup={viewSortPopup}
              />

              {isAdmin && (
                <ToggleViewSidebarButton
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowSidebar(!showSidebar);
                  }}
                />
              )}
            </Stack>
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
                {activeView.fields.viewType === 'table' && (
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
                    readOnlyRows
                    cardIdToFocusOnRender=''
                    addCard={async () => {}}
                    onCardClicked={() => {}}
                    onDeleteCard={onDelete}
                    expandSubRowsOnLoad
                    rowExpansionLocalStoragePrefix={currentSpace ? `rewards-${currentSpace.id}` : undefined}
                    subRowsEmptyValueContent='--'
                  />
                )}

                {activeView.fields.viewType === 'calendar' && (
                  <CalendarFullView
                    board={activeBoard}
                    cards={cards as Card[]}
                    activeView={activeView}
                    readOnly={!isAdmin}
                    dateDisplayProperty={dateDisplayProperty}
                    showCard={showRewardOrApplication}
                    addCard={async () => {}}
                    disableAddingCards
                  />
                )}

                {activeView.fields.viewType === 'board' && (
                  <Kanban
                    board={activeBoard}
                    activeView={activeView}
                    cards={cards as Card[]}
                    groupByProperty={groupByProperty}
                    visibleGroups={visibleGroups.filter((g) => !!g.option.id)}
                    hiddenGroups={hiddenGroups.filter((g) => !!g.option.id)}
                    selectedCardIds={[]}
                    readOnly={!isAdmin}
                    addCard={async () => {}}
                    onCardClicked={(e, card) => showRewardOrApplication(card.id)}
                    showCard={showRewardOrApplication}
                    disableAddingCards
                    readOnlyTitle
                    disableDnd
                    hideLinkedBounty
                  />
                )}
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
                hideLayoutSelectOptions={defaultRewardViews.includes(activeView?.id || '')}
                hideSourceOptions
                hideGroupOptions
                groupByProperty={groupByProperty}
                page={undefined}
                pageId={undefined}
                showView={() => {}}
                supportedViewTypes={supportedRewardViewTypes}
              />
            )}
          </Stack>
        </Box>
      )}
    </DatabaseContainer>
  );
}
