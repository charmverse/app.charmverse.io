import styled from '@emotion/styled';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, Grid, Stack, Typography } from '@mui/material';
import type { PageContent } from '@packages/charmeditor/interfaces';
import { createBoard } from '@packages/databases/board';
import type { Card } from '@packages/databases/card';
import { viewTypeToBlockId } from '@packages/databases/customBlocks/constants';
import mutator from '@packages/databases/mutator';
import { APPLICANT_STATUS_BLOCK_ID, DUE_DATE_ID, REWARD_STATUS_BLOCK_ID } from '@packages/lib/rewards/blocks/constants';
import { supportedRewardViewTypes } from '@packages/lib/rewards/blocks/views';
import { debounce } from 'lodash';
import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useTrashPages } from 'charmClient/hooks/pages';
import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import AddViewMenu from 'components/common/DatabaseEditor/components/addViewMenu';
import { getVisibleAndHiddenGroups } from 'components/common/DatabaseEditor/components/centerPanel';
import { CreateLinkedView } from 'components/common/DatabaseEditor/components/createLinkedView';
import Gallery from 'components/common/DatabaseEditor/components/gallery/gallery';
import Kanban from 'components/common/DatabaseEditor/components/kanban/kanban';
import Table from 'components/common/DatabaseEditor/components/table/table';
import { ViewFilterControl } from 'components/common/DatabaseEditor/components/ViewFilterControl';
import { ToggleViewSidebarButton } from 'components/common/DatabaseEditor/components/viewHeader/ToggleViewSidebarButton';
import ViewHeaderDisplayByMenu from 'components/common/DatabaseEditor/components/viewHeader/viewHeaderDisplayByMenu';
import ViewTabs from 'components/common/DatabaseEditor/components/viewHeader/viewTabs';
import { ViewSettingsRow } from 'components/common/DatabaseEditor/components/ViewSettingsRow';
import ViewSidebar from 'components/common/DatabaseEditor/components/viewSidebar/viewSidebar';
import { ViewSortControl } from 'components/common/DatabaseEditor/components/ViewSortControl';
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
import { useRewardsBoardAndBlocks } from 'components/rewards/hooks/useRewardsBoardAndBlocks';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useHasMemberLevel } from 'hooks/useHasMemberLevel';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';

import { RewardsHeaderRowsMenu } from './components/RewardsHeaderRowsMenu';
import { useRewards } from './hooks/useRewards';

const CalendarFullView = dynamic(() => import('../common/DatabaseEditor/components/calendar/fullCalendar'), {
  ssr: false
});

const StyledButton = styled(Button)`
  position: absolute;
  top: -30px;
  opacity: 0;
  transition: opacity 0.25s;
  &:hover {
    opacity: 1;
    transition: opacity 0.25s;
  }
`;

export function RewardsPage({ title }: { title: string }) {
  const { space: currentSpace } = useCurrentSpace();
  const { updateURLQuery, navigateToSpacePath } = useCharmRouter();
  const { isFreeSpace } = useIsFreeSpace();
  const { rewards, isLoading: loadingData } = useRewards();
  const { hasAccess, isLoadingAccess } = useHasMemberLevel('member');
  const canSeeRewards = hasAccess || isFreeSpace || currentSpace?.publicBountyBoard === true;
  const { getRewardPage } = useRewardPage();
  const [selectedPropertyId, setSelectedPropertyId] = useState<null | string>(null);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const isAdmin = useIsAdmin();

  const { board: activeBoard, views, cards, activeView } = useRewardsBoardAndBlocks();

  const [showSidebar, setShowSidebar] = useState(false);

  const groupByProperty = useMemo(() => {
    let _groupByProperty = activeBoard?.fields.cardProperties.find((o) => o.id === activeView?.fields.groupById);

    if ((!_groupByProperty || _groupByProperty?.type !== 'select') && activeView?.fields.viewType === 'board') {
      if (activeView.fields.sourceType === 'reward_applications') {
        _groupByProperty = activeBoard?.fields.cardProperties.find((o) => o.id === APPLICANT_STATUS_BLOCK_ID);
      } else {
        _groupByProperty = activeBoard?.fields.cardProperties.find((o) => o.id === REWARD_STATUS_BLOCK_ID);
      }
    }

    return _groupByProperty;
  }, [
    activeBoard?.fields.cardProperties,
    activeView?.fields.groupById,
    activeView?.fields.viewType,
    activeView.fields.sourceType
  ]);

  const { visible: visibleGroups, hidden: hiddenGroups } = useMemo(
    () =>
      activeView
        ? getVisibleAndHiddenGroups(
            cards,
            activeView.fields.visibleOptionIds,
            activeView.fields.hiddenOptionIds,
            groupByProperty
          )
        : { visible: [], hidden: [] },
    [activeView, cards, groupByProperty]
  );

  useRewardsBoardMutator();
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
    navigateToSpacePath(`/${pageId}`);
  }

  const onDelete = useCallback(async (rewardId: string) => {
    await trashPages({ pageIds: [rewardId], trash: true });
  }, []);

  const showRewardOrApplication = (id: string | null, rewardId?: string) => {
    if (id && (!rewardId || id === rewardId)) {
      openPage(id);
    } else if (id) {
      navigateToSpacePath(`/rewards/applications/${id}`);
    }
  };

  const onDescriptionChange = useMemo(
    () =>
      debounce((content: PageContent) => {
        const oldBlocks = [activeBoard];
        const newBoard = createBoard({
          block: activeBoard
        });
        newBoard.fields.description = content;
        mutator.updateBlocks([newBoard], oldBlocks, 'Change description');
      }, 250),
    [activeBoard]
  );

  const onShowDescription = useCallback(() => {
    const oldBlocks = [activeBoard];
    const newBoard = createBoard({
      block: activeBoard
    });
    newBoard.fields.showDescription = true;
    mutator.updateBlocks([newBoard], oldBlocks, 'Show description');
  }, [activeBoard]);

  const onHideDescription = useCallback(() => {
    const oldBlocks = [activeBoard];
    const newBoard = createBoard({
      block: activeBoard
    });
    newBoard.fields.showDescription = false;
    mutator.updateBlocks([newBoard], oldBlocks, 'Hide description');
  }, [activeBoard]);

  const showView = (boardViewId: string) => {
    const viewId = Object.entries(viewTypeToBlockId).find(([, blockId]) => blockId === boardViewId)?.[0] ?? boardViewId;
    if (viewId === activeView?.id) return;
    updateURLQuery({ viewId });
  };

  if (isLoadingAccess || !activeBoard) {
    return null;
  }

  if (!canSeeRewards) {
    return <ErrorPage message='You cannot access rewards for this space' />;
  }

  const showViewHeaderRowsMenu = checkedIds.length !== 0 && activeBoard;

  return (
    <DatabaseContainer>
      <DatabaseStickyHeader>
        <DatabaseTitle>
          <Box position='relative'>
            {isAdmin && (
              <StyledButton
                variant='text'
                color='secondary'
                size='small'
                onClick={() => {
                  if (activeBoard.fields.showDescription) {
                    onHideDescription();
                  } else {
                    onShowDescription();
                  }
                }}
              >
                {activeBoard.fields.showDescription ? (
                  <>
                    <VisibilityOffOutlinedIcon
                      fontSize='small'
                      sx={{
                        mr: 0.5
                      }}
                    />
                    <FormattedMessage id='ViewTitle.hide-description' defaultMessage='Hide description' />
                  </>
                ) : (
                  <>
                    <VisibilityOutlinedIcon
                      fontSize='small'
                      sx={{
                        mr: 0.5
                      }}
                    />
                    <FormattedMessage id='ViewTitle.show-description' defaultMessage='Show description' />
                  </>
                )}
              </StyledButton>
            )}
          </Box>
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
          {activeBoard.fields.showDescription && (
            <div className='description'>
              <CharmEditor
                disablePageSpecificFeatures
                isContentControlled
                content={activeBoard.fields.description}
                onContentChange={(content: ICharmEditorOutput) => {
                  onDescriptionChange(content.doc);
                }}
                style={{
                  marginLeft: 35
                }}
                disableRowHandles
                disableNestedPages
                readOnly={!isAdmin}
              />
            </div>
          )}
        </DatabaseTitle>
        <Stack gap={0.75}>
          <div className={`ViewHeader ${showViewHeaderRowsMenu ? 'view-header-rows-menu-visible' : ''}`}>
            {showViewHeaderRowsMenu ? (
              <RewardsHeaderRowsMenu
                visiblePropertyIds={activeView?.fields.visiblePropertyIds}
                board={activeBoard}
                cards={cards as Card[]}
                checkedIds={checkedIds}
                setCheckedIds={setCheckedIds}
              />
            ) : (
              <>
                <ViewTabs
                  openViewOptions={() => setShowSidebar(true)}
                  board={activeBoard}
                  views={views}
                  readOnly={!isAdmin}
                  showView={showView}
                  activeView={activeView}
                  disableUpdatingUrl
                  maxTabsShown={3}
                  supportedViewTypes={supportedRewardViewTypes}
                />
                {isAdmin && views.length <= 3 && (
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
              </>
            )}

            <div className='octo-spacer' />

            <Box className='view-actions'>
              {withDisplayBy && (
                <ViewHeaderDisplayByMenu
                  properties={activeBoard?.fields.cardProperties ?? []}
                  activeView={activeView}
                  dateDisplayPropertyName={dateDisplayProperty?.name || '-'}
                />
              )}

              <ViewFilterControl activeBoard={activeBoard} activeView={activeView} />

              <ViewSortControl activeBoard={activeBoard} activeView={activeView} cards={cards as Card[]} />

              {isAdmin && (
                <ToggleViewSidebarButton
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowSidebar(!showSidebar);
                  }}
                />
              )}
            </Box>
          </div>

          <ViewSettingsRow activeView={activeView} canSaveGlobally={isAdmin} />
        </Stack>
      </DatabaseStickyHeader>

      {loadingData ? (
        <Grid item xs={12} sx={{ mt: 12 }}>
          <LoadingComponent height={500} isLoading size={50} />
        </Grid>
      ) : (
        <Box className={`container-container ${showSidebar ? 'sidebar-visible' : ''}`}>
          <Stack>
            {!activeView?.fields?.sourceType && activeView.fields.viewType === 'board' ? (
              <Box width='100%'>
                <CreateLinkedView
                  rootBoard={activeBoard}
                  views={views}
                  showView={showView}
                  isReward
                  view={activeView}
                />
              </Box>
            ) : rewards && rewards?.length > 0 ? (
              <Box width='100%'>
                {activeView.fields.viewType === 'table' && (
                  <Table
                    boardType='rewards'
                    setSelectedPropertyId={(_setSelectedPropertyId) => {
                      setSelectedPropertyId(_setSelectedPropertyId);
                      setShowSidebar(true);
                    }}
                    setCheckedIds={setCheckedIds}
                    checkedIds={checkedIds}
                    board={activeBoard}
                    activeView={activeView}
                    cards={cards}
                    groupByProperty={groupByProperty}
                    views={views}
                    visibleGroups={visibleGroups}
                    selectedCardIds={[]}
                    readOnly={!isAdmin}
                    disableAddingCards
                    showCard={() => {}}
                    readOnlyTitle
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
                    cards={cards}
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
                    cards={cards}
                    groupByProperty={groupByProperty}
                    visibleGroups={visibleGroups.filter((g) => !!g.id)}
                    hiddenGroups={hiddenGroups.filter((g) => !!g.id)}
                    selectedCardIds={[]}
                    readOnly={!isAdmin}
                    addCard={async () => {}}
                    isApplication={activeView.fields.sourceType === 'reward_applications'}
                    onCardClicked={(_e, card) => showRewardOrApplication(card.id, card?.parentId)}
                    showCard={showRewardOrApplication}
                    disableAddingCards
                    readOnlyTitle
                    disableDnd
                    hideLinkedBounty
                  />
                )}

                {activeView.fields.viewType === 'gallery' && (
                  <Gallery
                    board={activeBoard}
                    cards={cards}
                    activeView={activeView}
                    readOnly={!isAdmin}
                    onCardClicked={(_e, card) => showRewardOrApplication(card.id, card?.parentId)}
                    selectedCardIds={[]}
                    addCard={() => {}}
                    disableAddingCards={true}
                  />
                )}
              </Box>
            ) : (
              <Box sx={{ mt: 3 }}>
                <EmptyStateVideo
                  description='Getting started'
                  videoTitle='Rewards | Getting started with CharmVerse'
                  videoUrl='https://tiny.charmverse.io/bounties'
                />
              </Box>
            )}

            {isAdmin && (
              <ViewSidebar
                sidebarView={selectedPropertyId ? 'card-property' : undefined}
                setSelectedPropertyId={setSelectedPropertyId}
                selectedPropertyId={selectedPropertyId}
                cards={cards}
                views={views}
                board={activeBoard}
                rootBoard={activeBoard}
                view={activeView}
                isOpen={!!showSidebar}
                closeSidebar={() => setShowSidebar(false)}
                hideLayoutOptions
                hideLayoutSelectOptions={undefined}
                groupByProperty={groupByProperty}
                page={undefined}
                pageId={undefined}
                showView={() => {}}
                supportedViewTypes={supportedRewardViewTypes}
                isReward
              />
            )}
          </Stack>
        </Box>
      )}
    </DatabaseContainer>
  );
}
