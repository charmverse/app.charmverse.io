import { Box, Grid, Stack, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useCallback, useMemo, useState } from 'react';

import { useTrashPages } from 'charmClient/hooks/pages';
import { ViewFilterControl } from 'components/common/BoardEditor/components/ViewFilterControl';
import { ViewSettingsRow } from 'components/common/BoardEditor/components/ViewSettingsRow';
import { ViewSortControl } from 'components/common/BoardEditor/components/ViewSortControl';
import Table from 'components/common/BoardEditor/focalboard/src/components/table/table';
import { ToggleViewSidebarButton } from 'components/common/BoardEditor/focalboard/src/components/viewHeader/ToggleViewSidebarButton';
import ViewSidebar from 'components/common/BoardEditor/focalboard/src/components/viewSidebar/viewSidebar';
import { EmptyStateVideo } from 'components/common/EmptyStateVideo';
import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import {
  DatabaseContainer,
  DatabaseStickyHeader,
  DatabaseTitle
} from 'components/common/PageLayout/components/DatabasePageContent';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useHasMemberLevel } from 'hooks/useHasMemberLevel';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

import { NewProposalButton } from './components/NewProposalButton';
import { useProposalsBoardMutator } from './components/ProposalsBoard/hooks/useProposalsBoardMutator';
import { ProposalsHeaderRowsMenu } from './components/ProposalsHeaderRowsMenu';
import { useProposalsBoard } from './hooks/useProposalsBoard';

export function ProposalsPage({ title }: { title: string }) {
  const { space: currentSpace } = useCurrentSpace();
  const { isFreeSpace } = useIsFreeSpace();
  const { hasAccess, isLoadingAccess } = useHasMemberLevel('member');
  const [selectedPropertyId, setSelectedPropertyId] = useState<null | string>(null);
  const canSeeProposals = hasAccess || isFreeSpace || currentSpace?.publicProposals === true;
  const { navigateToSpacePath } = useCharmRouter();
  const isAdmin = useIsAdmin();
  const { showError } = useSnackbar();
  const { user } = useUser();
  const { board: activeBoard, views, cardPages, activeView, cards, isLoading, refreshProposals } = useProposalsBoard();
  const [showSidebar, setShowSidebar] = useState(false);
  const viewSortPopup = usePopupState({ variant: 'popover', popupId: 'view-sort' });
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const { trigger: trashPages } = useTrashPages();
  const groupByProperty = useMemo(() => {
    let _groupByProperty = activeBoard?.fields.cardProperties.find((o) => o.id === activeView?.fields.groupById);

    if (
      (!_groupByProperty || (_groupByProperty?.type !== 'select' && _groupByProperty?.type !== 'proposalStatus')) &&
      activeView?.fields.viewType === 'board'
    ) {
      _groupByProperty = activeBoard?.fields.cardProperties.find((o: any) => o.type === 'select');
    }

    return _groupByProperty;
  }, [activeBoard?.fields.cardProperties, activeView?.fields.groupById, activeView?.fields.viewType]);

  useProposalsBoardMutator();

  function openPage(pageId: string | null) {
    if (!pageId) return;
    navigateToSpacePath(`/${pageId}`);
  }

  const onDelete = useCallback(
    async (proposalId: string) => {
      try {
        await trashPages({ pageIds: [proposalId], trash: true });
      } catch (error) {
        showError(error, 'Could not archive page');
      }
    },
    [showError, trashPages]
  );

  if (isLoadingAccess) {
    return null;
  }

  if (!canSeeProposals) {
    return <ErrorPage message='You cannot access proposals for this space' />;
  }

  const showViewHeaderRowsMenu = checkedIds.length !== 0 && activeBoard;

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
                <NewProposalButton />
              </Box>
            </Box>
          </Box>
        </DatabaseTitle>
        <Stack gap={0.75}>
          <div className={`ViewHeader ${showViewHeaderRowsMenu ? 'view-header-rows-menu-visible' : ''}`}>
            {showViewHeaderRowsMenu && (
              <ProposalsHeaderRowsMenu
                visiblePropertyIds={activeView?.fields.visiblePropertyIds}
                board={activeBoard}
                cards={cards}
                checkedIds={checkedIds}
                setCheckedIds={setCheckedIds}
                onChange={refreshProposals}
                refreshProposals={refreshProposals}
              />
            )}
            <div className='octo-spacer' />
            <Box className='view-actions'>
              <ViewFilterControl activeBoard={activeBoard} activeView={activeView} />
              <ViewSortControl
                activeBoard={activeBoard}
                activeView={activeView}
                cards={cards}
                viewSortPopup={viewSortPopup}
              />
              {user && (
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

      {isLoading ? (
        <Grid item xs={12} sx={{ mt: 12 }}>
          <LoadingComponent height={500} isLoading size={50} />
        </Grid>
      ) : (
        <Box className={`container-container ${showSidebar ? 'sidebar-visible' : ''}`}>
          <Stack>
            {cardPages.length > 0 ? (
              <Box width='100%'>
                <Table
                  boardType='proposals'
                  setSelectedPropertyId={(_setSelectedPropertyId) => {
                    setSelectedPropertyId(_setSelectedPropertyId);
                    setShowSidebar(true);
                  }}
                  board={activeBoard}
                  activeView={activeView}
                  cardPages={cardPages}
                  groupByProperty={groupByProperty}
                  views={views}
                  visibleGroups={[]}
                  selectedCardIds={[]}
                  readOnly={!isAdmin}
                  disableAddingCards
                  showCard={openPage}
                  readOnlyTitle={!isAdmin}
                  cardIdToFocusOnRender=''
                  addCard={async () => {}}
                  onCardClicked={() => {}}
                  onDeleteCard={onDelete}
                  setCheckedIds={setCheckedIds}
                  checkedIds={checkedIds}
                />
              </Box>
            ) : (
              <Box sx={{ mt: 3 }}>
                <EmptyStateVideo
                  description='Getting started'
                  videoTitle='Proposals | Getting started with CharmVerse'
                  videoUrl='https://tiny.charmverse.io/proposal-builder'
                />
              </Box>
            )}

            <ViewSidebar
              selectedPropertyId={selectedPropertyId}
              setSelectedPropertyId={setSelectedPropertyId}
              sidebarView={selectedPropertyId && showSidebar ? 'card-property' : undefined}
              cards={cards}
              views={views}
              board={activeBoard}
              rootBoard={activeBoard}
              view={activeView}
              isOpen={showSidebar}
              closeSidebar={() => {
                setShowSidebar(false);
              }}
              hideLayoutOptions
              hideSourceOptions
              hideGroupOptions
              hidePropertiesRow={!isAdmin}
              groupByProperty={groupByProperty}
              page={undefined}
              pageId={undefined}
              showView={() => {}}
            />
          </Stack>
        </Box>
      )}
    </DatabaseContainer>
  );
}
