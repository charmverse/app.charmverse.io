import { Box, Grid, Stack, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import { ViewFilterControl } from 'components/common/BoardEditor/components/ViewFilterControl';
import { ViewSettingsRow } from 'components/common/BoardEditor/components/ViewSettingsRow';
import { ViewSortControl } from 'components/common/BoardEditor/components/ViewSortControl';
import Table from 'components/common/BoardEditor/focalboard/src/components/table/table';
import ViewHeaderActionsMenu from 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewHeaderActionsMenu';
import { ViewHeaderRowsMenu } from 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewHeaderRowsMenu';
import ViewSidebar from 'components/common/BoardEditor/focalboard/src/components/viewSidebar/viewSidebar';
import { EmptyStateVideo } from 'components/common/EmptyStateVideo';
import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import {
  DatabaseContainer,
  DatabaseTitle,
  DatabaseStickyHeader
} from 'components/common/PageLayout/components/DatabasePageContent';
import { NewProposalButton } from 'components/proposals/components/NewProposalButton';
import { ProposalDialog } from 'components/proposals/components/ProposalDialog/ProposalDialog';
import { useProposalsBoardMutator } from 'components/proposals/components/ProposalsBoard/hooks/useProposalsBoardMutator';
import { useProposalsBoard } from 'components/proposals/hooks/useProposalsBoard';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useHasMemberLevel } from 'hooks/useHasMemberLevel';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import { UpdateProposalRequest } from 'lib/proposal/updateProposal';
import { isTruthy } from 'lib/utilities/types';

import { useProposalDialog } from './components/ProposalDialog/hooks/useProposalDialog';
import { useProposals } from './hooks/useProposals';

export function ProposalsPage({ title }: { title: string }) {
  const { space: currentSpace } = useCurrentSpace();
  const { isFreeSpace } = useIsFreeSpace();
  const { proposals, mutateProposals } = useProposals();
  const loadingData = !proposals;
  const { hasAccess, isLoadingAccess } = useHasMemberLevel('member');
  const canSeeProposals = hasAccess || isFreeSpace || currentSpace?.publicProposals === true;
  const { navigateToSpacePath, updateURLQuery } = useCharmRouter();
  const isAdmin = useIsAdmin();
  const { user } = useUser();
  const { props, showProposal, hideProposal } = useProposalDialog();
  const { board: activeBoard, views, cardPages, activeView, cards } = useProposalsBoard();
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(false);
  const viewSortPopup = usePopupState({ variant: 'popover', popupId: 'view-sort' });
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const { pages } = usePages();
  const groupByProperty = useMemo(() => {
    let _groupByProperty = activeBoard?.fields.cardProperties.find((o) => o.id === activeView?.fields.groupById);

    if (
      (!_groupByProperty ||
        (_groupByProperty?.type !== 'select' &&
          _groupByProperty?.type !== 'proposalCategory' &&
          _groupByProperty?.type !== 'proposalStatus')) &&
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

  function closeDialog() {
    updateURLQuery({ id: null });
  }

  const onDelete = useCallback(async (proposalId: string) => {
    await charmClient.deletePage(proposalId);
  }, []);

  useEffect(() => {
    if (typeof router.query.id === 'string') {
      showProposal({
        pageId: router.query.id
      });
    } else {
      hideProposal();
    }
  }, [router.query.id]);

  async function deleteProposals(pageIds: string[]) {
    for (const pageId of pageIds) {
      const proposalId = pages[pageId]?.proposalId;
      if (proposalId) {
        try {
          await charmClient.deletePage(proposalId);
        } catch (err) {
          //
        }
      }
    }
    await mutateProposals();
  }

  async function updateProposalsAuthor(pageIds: string[], authorIds: string[]) {
    for (const pageId of pageIds) {
      const proposalId = pages[pageId]?.proposalId;
      if (proposalId) {
        try {
          await charmClient.proposals.updateProposal({
            authors: authorIds,
            proposalId
          });
        } catch (err) {
          //
        }
      }
    }
    await mutateProposals();
  }

  if (isLoadingAccess) {
    return null;
  }

  if (!canSeeProposals) {
    return <ErrorPage message='You cannot access proposals for this space' />;
  }

  const showViewHeaderRowsMenu = checkedIds.length !== 0 && activeBoard;

  const propertyTemplates: IPropertyTemplate<PropertyType>[] = [];

  if (activeView?.fields?.visiblePropertyIds.length) {
    activeView.fields.visiblePropertyIds.forEach((propertyId) => {
      const property = activeBoard?.fields.cardProperties.find((p) => p.id === propertyId);
      if (property) {
        propertyTemplates.push(property);
      }
    });
  } else {
    activeBoard?.fields.cardProperties.forEach((property) => {
      propertyTemplates.push(property);
    });
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
                <NewProposalButton />
              </Box>
            </Box>
          </Box>
        </DatabaseTitle>
        <Stack gap={0.75}>
          <div className={`ViewHeader ${showViewHeaderRowsMenu ? 'view-header-rows-menu-visible' : ''}`}>
            {showViewHeaderRowsMenu && (
              <ViewHeaderRowsMenu
                board={activeBoard}
                cards={cards}
                checkedIds={checkedIds}
                setCheckedIds={setCheckedIds}
                propertyTemplates={propertyTemplates}
                onChange={() => {
                  mutateProposals();
                }}
                onDelete={deleteProposals}
                onProposalAuthorSelect={updateProposalsAuthor}
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
                <ViewHeaderActionsMenu
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
            {proposals?.length > 0 ? (
              <Box width='100%'>
                <Table
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
                  readOnlyTitle
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
                  description='Getting started with proposals'
                  videoTitle='Proposals | Getting started with CharmVerse'
                  videoUrl='https://tiny.charmverse.io/proposal-builder'
                />
              </Box>
            )}

            <ViewSidebar
              views={views}
              board={activeBoard}
              rootBoard={activeBoard}
              view={activeView}
              isOpen={!!showSidebar}
              closeSidebar={() => setShowSidebar(false)}
              hideLayoutOptions
              hideSourceOptions
              hideGroupOptions
              hidePropertiesRow={!isAdmin}
              groupByProperty={groupByProperty}
              page={undefined}
              pageId={undefined}
              showView={() => {}}
              withProposalCategories
            />
          </Stack>
        </Box>
      )}
      {props.pageId && <ProposalDialog pageId={props.pageId} closeDialog={closeDialog} />}
    </DatabaseContainer>
  );
}
