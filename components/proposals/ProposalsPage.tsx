import { Box, Divider, Grid, Stack, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
import { useUser } from 'hooks/useUser';

import { useProposalDialog } from './components/ProposalDialog/hooks/useProposalDialog';
import type { ProposalPageAndPropertiesInput } from './components/ProposalDialog/NewProposalPage';
import { useProposals } from './hooks/useProposals';

export function ProposalsPage({ title }: { title: string }) {
  const { space: currentSpace } = useCurrentSpace();
  const { isFreeSpace } = useIsFreeSpace();
  const { proposals } = useProposals();
  const [newProposal, setNewProposal] = useState<Partial<ProposalPageAndPropertiesInput> | null>(null);
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
    const openPageIn = activeView?.fields.openPageIn ?? 'center_peek';
    if (openPageIn === 'center_peek') {
      updateURLQuery({ id: pageId });
    } else if (openPageIn === 'full_page') {
      navigateToSpacePath(`/${pageId}`);
    }
  }

  function closeDialog() {
    updateURLQuery({ id: null });
    setNewProposal(null);
  }

  function showNewProposal(input: Partial<ProposalPageAndPropertiesInput> = {}) {
    setNewProposal(input);
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

  if (isLoadingAccess) {
    return null;
  }

  if (!canSeeProposals) {
    return <ErrorPage message='You cannot access proposals for this space' />;
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
                <NewProposalButton showProposal={openPage} showNewProposal={showNewProposal} />
              </Box>
            </Box>
          </Box>
        </DatabaseTitle>
        <>
          <Stack direction='row' alignItems='center' justifyContent='flex-end' mb={1} gap={1}>
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
                  readOnlyRows
                  cardIdToFocusOnRender=''
                  addCard={async () => {}}
                  onCardClicked={() => {}}
                  onDeleteCard={onDelete}
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
              hideLayoutSelectOptions
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
      {(props.pageId || newProposal) && (
        <ProposalDialog pageId={props.pageId} newProposal={newProposal} closeDialog={closeDialog} />
      )}
    </DatabaseContainer>
  );
}
