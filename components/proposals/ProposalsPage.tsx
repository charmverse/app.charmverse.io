import styled from '@emotion/styled';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, Grid, Stack, Typography } from '@mui/material';
import { debounce } from 'lodash';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useTrashPages } from 'charmClient/hooks/pages';
import { Button } from 'components/common/Button';
import CharmEditor from 'components/common/CharmEditor/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/specRegistry';
import Table from 'components/common/DatabaseEditor/components/table/table';
import { ViewFilterControl } from 'components/common/DatabaseEditor/components/ViewFilterControl';
import { ToggleViewSidebarButton } from 'components/common/DatabaseEditor/components/viewHeader/ToggleViewSidebarButton';
import { ViewSettingsRow } from 'components/common/DatabaseEditor/components/ViewSettingsRow';
import ViewSidebar from 'components/common/DatabaseEditor/components/viewSidebar/viewSidebar';
import { ViewSortControl } from 'components/common/DatabaseEditor/components/ViewSortControl';
import mutator from 'components/common/DatabaseEditor/mutator';
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
import { createBoard } from 'lib/databases/board';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { NewProposalButton } from './components/NewProposalButton';
import { useProposalsBoardMutator } from './components/ProposalsBoard/hooks/useProposalsBoardMutator';
import { ProposalsHeaderRowsMenu } from './components/ProposalsHeaderRowsMenu';
import { useProposalsBoard } from './hooks/useProposalsBoard';

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
                <NewProposalButton />
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
