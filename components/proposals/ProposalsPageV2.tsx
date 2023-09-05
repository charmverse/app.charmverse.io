import { Box, Divider, Grid, Stack, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import { ViewSortControl } from 'components/common/BoardEditor/components/ViewSortControl';
import Table from 'components/common/BoardEditor/focalboard/src/components/table/table';
import ViewHeaderActionsMenu from 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewHeaderActionsMenu';
import ViewSidebar from 'components/common/BoardEditor/focalboard/src/components/viewSidebar/viewSidebar';
import { EmptyStateVideo } from 'components/common/EmptyStateVideo';
import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import { NewProposalButton } from 'components/proposals/components/NewProposalButton';
import { useProposalsBoardMutator } from 'components/proposals/components/ProposalsBoard/hooks/useProposalsBoardMutator';
import { useProposalsBoard } from 'components/proposals/hooks/useProposalsBoard';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useHasMemberLevel } from 'hooks/useHasMemberLevel';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import { ProposalDialogProvider, useProposalDialog } from './components/ProposalDialog/hooks/useProposalDialog';
import ProposalDialogGlobal from './components/ProposalDialog/ProposalDialogGlobal';
import { ProposalsViewOptions } from './components/ProposalViewOptions/ProposalsViewOptions';
import { useProposalCategories } from './hooks/useProposalCategories';
import { useProposals } from './hooks/useProposals';

export function ProposalsPage({ title }: { title: string }) {
  const { categories = [] } = useProposalCategories();
  const { space: currentSpace } = useCurrentSpace();
  const { isFreeSpace } = useIsFreeSpace();
  const { statusFilter, setStatusFilter, categoryIdFilter, setCategoryIdFilter, proposals } = useProposals();

  useEffect(() => {
    if (currentSpace?.id) {
      charmClient.track.trackAction('page_view', { spaceId: currentSpace.id, type: 'proposals_list' });
    }
  }, [currentSpace?.id]);

  const loadingData = !proposals;
  const { hasAccess, isLoadingAccess } = useHasMemberLevel('member');
  const canSeeProposals = hasAccess || isFreeSpace || currentSpace?.publicProposals === true;

  const isAdmin = useIsAdmin();

  const { showProposal, hideProposal } = useProposalDialog();
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

  function onClose() {
    setUrlWithoutRerender(router.pathname, { id: null });
    hideProposal();
  }

  function openPage(pageId: string | null) {
    if (!pageId) return;

    setUrlWithoutRerender(router.pathname, { id: pageId });
    showProposal({
      pageId,
      onClose
    });
  }

  if (isLoadingAccess) {
    return null;
  }

  if (!canSeeProposals) {
    return <ErrorPage message='You cannot access proposals for this space' />;
  }

  return (
    <div className='focalboard-body full-page'>
      <Box className='BoardComponent' py={(theme) => theme.spacing(8)}>
        <div className='top-head'>
          <Grid container mb={6}>
            <Grid item xs={12}>
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
            </Grid>
          </Grid>
          <Stack direction='row' alignItems='center' justifyContent='flex-end' mb={1} gap={1}>
            <ProposalsViewOptions
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              categoryIdFilter={categoryIdFilter}
              setCategoryIdFilter={setCategoryIdFilter}
              categories={categories}
              // Playwright-specific
              testKey='desktop'
            />

            <ViewSortControl
              activeBoard={activeBoard}
              activeView={activeView}
              cards={cards}
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
        </div>

        {loadingData ? (
          <Grid item xs={12} sx={{ mt: 12 }}>
            <LoadingComponent height={500} isLoading size={50} />
          </Grid>
        ) : (
          <>
            {proposals?.length === 0 && (
              <Grid item xs={12} position='relative'>
                <Box sx={{ mt: 5 }}>
                  <EmptyStateVideo
                    description='Getting started with proposals'
                    videoTitle='Proposals | Getting started with CharmVerse'
                    videoUrl='https://tiny.charmverse.io/proposal-builder'
                  />
                </Box>
              </Grid>
            )}
            {proposals?.length > 0 && (
              <Box className={`container-container ${showSidebar ? 'sidebar-visible' : ''}`}>
                <Stack>
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
                      readOnlySourceData={false}
                      cardIdToFocusOnRender=''
                      showCard={openPage}
                      addCard={async () => {}}
                      onCardClicked={() => {}}
                      disableAddingCards={true}
                      readOnlyTitle={true}
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
      </Box>
    </div>
  );
}
