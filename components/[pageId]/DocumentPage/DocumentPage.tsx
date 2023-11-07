import type { Page } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import { useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { memo, useEffect, useRef, useState } from 'react';
import { useElementSize } from 'usehooks-ts';

import { PageComments } from 'components/[pageId]/Comments/PageComments';
import AddBountyButton from 'components/common/BoardEditor/focalboard/src/components/cardDetail/AddBountyButton';
import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import { blockLoad, databaseViewsLoad } from 'components/common/BoardEditor/focalboard/src/store/databaseBlocksLoad';
import { useAppDispatch, useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { CharmEditor } from 'components/common/CharmEditor';
import { CardPropertiesWrapper } from 'components/common/CharmEditor/CardPropertiesWrapper';
import type { FrontendParticipant } from 'components/common/CharmEditor/components/fiduswriter/collab';
import type { ConnectionEvent } from 'components/common/CharmEditor/components/fiduswriter/ws';
import { SnapshotVoteDetails } from 'components/common/CharmEditor/components/inlineVote/components/SnapshotVoteDetails';
import { VoteDetail } from 'components/common/CharmEditor/components/inlineVote/components/VoteDetail';
import { useProposalPermissions } from 'components/proposals/hooks/useProposalPermissions';
import { useBounties } from 'hooks/useBounties';
import { useBountyPermissions } from 'hooks/useBountyPermissions';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { usePageSidebar } from 'hooks/usePageSidebar';
import { useVotes } from 'hooks/useVotes';
import type { PageWithContent } from 'lib/pages/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { fontClassName } from 'theme/fonts';

import { AlertContainer } from './components/AlertContainer';
import PageBanner from './components/PageBanner';
import { PageConnectionBanner } from './components/PageConnectionBanner';
import PageDeleteBanner from './components/PageDeleteBanner';
import PageHeader, { getPageTop } from './components/PageHeader';
import { PageTemplateBanner } from './components/PageTemplateBanner';
import { ProposalBanner } from './components/ProposalBanner';
import { ProposalProperties } from './components/ProposalProperties';

const BountyProperties = dynamic(() => import('./components/BountyProperties/BountyProperties'), { ssr: false });
const RewardProperties = dynamic(
  () => import('components/rewards/components/RewardProperties/RewardProperties').then((r) => r.RewardProperties),
  { ssr: false }
);

export const Container = styled(({ fullWidth, top, ...props }: any) => <Box {...props} />)<{
  top: number;
  fullWidth?: boolean;
}>`
  width: ${({ fullWidth }) => (fullWidth ? '100%' : '860px')};
  max-width: 100%;
  margin: 0 auto ${({ top }) => top}px;
  position: relative;
  top: ${({ top }) => top}px;
  padding: 0 40px 0 30px;

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: 0 80px;
  }
`;

const ScrollContainer = styled.div<{ showPageActionSidebar: boolean }>(
  ({ showPageActionSidebar, theme }) => `
  transition: width ease-in 0.25s;
  ${theme.breakpoints.up('lg')} {
    width: ${showPageActionSidebar ? 'calc(100% - 430px)' : '100%'};
    height: ${showPageActionSidebar ? 'calc(100vh - 65px)' : '100%'};
    overflow: ${showPageActionSidebar ? 'auto' : 'inherit'};
  }
`
);

export interface DocumentPageProps {
  page: PageWithContent;
  refreshPage: () => Promise<any>;
  savePage: (p: Partial<Page>) => void;
  readOnly?: boolean;
  close?: VoidFunction;
}

function DocumentPage({ page, refreshPage, savePage, readOnly = false, close }: DocumentPageProps) {
  const { cancelVote, castVote, deleteVote, updateDeadline, votes, isLoading } = useVotes({ pageId: page.id });

  const { activeView: sidebarView, isInsideDialog } = usePageSidebar();
  const { editMode, setPageProps, printRef: _printRef } = useCharmEditor();
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));
  const blocksDispatch = useAppDispatch();
  const [containerRef, { width: containerWidth }] = useElementSize();
  const { permissions: bountyPermissions, refresh: refreshBountyPermissions } = useBountyPermissions({
    bountyId: page.bountyId
  });

  const { draftBounty } = useBounties();

  const pagePermissions = page.permissionFlags;
  const proposalId = page.proposalId;

  const { permissions: proposalPermissions } = useProposalPermissions({ proposalIdOrPath: proposalId as string });
  // We can only edit the proposal from the top level
  const readonlyProposalProperties = !page.proposalId || readOnly;
  // keep a ref in sync for printing
  const printRef = useRef(null);
  useEffect(() => {
    if (printRef?.current !== _printRef?.current) {
      setPageProps({
        printRef
      });
    }
  }, [printRef, _printRef]);

  const cannotComment = readOnly || !pagePermissions.comment;

  const card = useAppSelector((state) => {
    if (page?.type !== 'card') {
      return null;
    }
    return state.cards.cards[page.id] ?? state.cards.templates[page.id];
  });

  const board = useAppSelector((state) => {
    if (!card) {
      return null;
    }

    return state.boards.boards[card.parentId];
  });

  const cards = useAppSelector((state) => {
    return board
      ? [...Object.values(state.cards.cards), ...Object.values(state.cards.templates)].filter(
          (c) => c.parentId === board.id
        )
      : [];
  });

  const boardViews = useAppSelector((state) => {
    if (board) {
      return Object.values(state.views.views).filter((view) => view.parentId === board.id);
    }
    return [];
  });

  useEffect(() => {
    if (page?.type === 'card') {
      if (!card) {
        blocksDispatch(databaseViewsLoad({ pageId: page.parentId as string }));
        blocksDispatch(blockLoad({ blockId: page.id }));
        blocksDispatch(blockLoad({ blockId: page.parentId as string }));
      }
    }
  }, [page.id]);

  const activeView = boardViews[0];

  const pageTop = getPageTop(page);

  const router = useRouter();
  const isSharedPage = router.pathname.startsWith('/share');
  // TODO: this logic should be removed when we release rewards in place of bounties
  const isRewardsPage = router.pathname.endsWith('/rewards');
  const fontFamilyClassName = `font-family-${page.fontFamily}${page.fontSizeSmall ? ' font-size-small' : ''}`;

  const enableSuggestingMode = editMode === 'suggesting' && !readOnly && !!pagePermissions.comment;
  const isPageTemplate = page.type.includes('template');
  const enableComments = !isSharedPage && !enableSuggestingMode && !isPageTemplate && !!pagePermissions?.comment;
  const showPageActionSidebar = sidebarView !== null && (sidebarView !== 'comments' || enableComments);

  const pageVote = Object.values(votes).find((v) => v.context === 'proposal');

  // create a key that updates when edit mode changes - default to 'editing' so we dont close sockets immediately
  const editorKey = page.id + (editMode || 'editing') + pagePermissions.edit_content;

  function onParticipantUpdate(participants: FrontendParticipant[]) {
    setPageProps({ participants });
  }

  function onConnectionEvent(event: ConnectionEvent) {
    if (event.type === 'error') {
      setConnectionError(event.error);
    } else if (event.type === 'subscribed') {
      // clear out error in case we re-subscribed
      setConnectionError(null);
    }
  }
  // reset error whenever page id changes
  useEffect(() => {
    setConnectionError(null);
  }, [page.id]);

  return (
    <>
      {!!page?.deletedAt && (
        <AlertContainer showPageActionSidebar={showPageActionSidebar}>
          <PageDeleteBanner pageType={page.type} pageId={page.id} />
        </AlertContainer>
      )}
      {connectionError && (
        <AlertContainer showPageActionSidebar={showPageActionSidebar}>
          <PageConnectionBanner />
        </AlertContainer>
      )}
      {page?.convertedProposalId && (
        <AlertContainer showPageActionSidebar={showPageActionSidebar}>
          <ProposalBanner type='page' proposalId={page.convertedProposalId} />
        </AlertContainer>
      )}
      <div ref={printRef} className={`document-print-container ${fontClassName}`}>
        <ScrollContainer id='document-scroll-container' showPageActionSidebar={showPageActionSidebar}>
          <Box display='flex' flexDirection='column' ref={containerRef}>
            <PageTemplateBanner parentId={page.parentId} pageType={page.type} />
            {/* temporary? disable editing of page meta data when in suggestion mode */}
            {page.headerImage && (
              <PageBanner
                headerImage={page.headerImage}
                readOnly={readOnly || !!enableSuggestingMode}
                setPage={savePage}
              />
            )}
            <Container
              data-test='page-charmeditor'
              className={fontFamilyClassName}
              top={pageTop}
              fullWidth={isSmallScreen || (page.fullWidth ?? false)}
            >
              <CharmEditor
                placeholderText={
                  page.type === 'bounty' || page.type === 'bounty_template'
                    ? `Describe the bounty. Type '/' to see the list of available commands`
                    : undefined
                }
                key={editorKey}
                content={page.content as PageContent}
                readOnly={readOnly || !!page.syncWithPageId}
                autoFocus={false}
                PageSidebar={sidebarView}
                pageId={page.id}
                disablePageSpecificFeatures={isSharedPage}
                enableSuggestingMode={enableSuggestingMode}
                enableVoting={page.type !== 'proposal'}
                enableComments={enableComments}
                containerWidth={containerWidth}
                pageType={page.type}
                pagePermissions={pagePermissions ?? undefined}
                onConnectionEvent={onConnectionEvent}
                snapshotProposalId={page.snapshotProposalId}
                onParticipantUpdate={onParticipantUpdate}
                style={{
                  minHeight: proposalId ? '100px' : 'unset'
                }}
                disableNestedPages={page?.type === 'proposal' || page?.type === 'proposal_template'}
                allowClickingFooter={true}
              >
                {/* temporary? disable editing of page title when in suggestion mode */}
                <PageHeader
                  headerImage={page.headerImage}
                  // Commented for now, as we need to preserve cursor position between re-renders caused by updating this
                  // key={page.title}
                  icon={page.icon}
                  title={page.title}
                  updatedAt={page.updatedAt.toString()}
                  readOnly={readOnly || !!enableSuggestingMode}
                  setPage={savePage}
                  readOnlyTitle={!!page.syncWithPageId}
                />
                {page.type === 'proposal' && !isLoading && page.snapshotProposalId && (
                  <Box my={2} className='font-family-default'>
                    <SnapshotVoteDetails snapshotProposalId={page.snapshotProposalId} />
                  </Box>
                )}
                {page.type === 'proposal' && !isLoading && pageVote && (
                  <Box my={2} className='font-family-default'>
                    <VoteDetail
                      cancelVote={cancelVote}
                      deleteVote={deleteVote}
                      castVote={castVote}
                      updateDeadline={updateDeadline}
                      vote={pageVote}
                      detailed={false}
                      isProposal={true}
                      disableVote={!proposalPermissions?.vote}
                    />
                  </Box>
                )}
                <CardPropertiesWrapper>
                  {/* Property list */}
                  {card && board && (
                    <>
                      <CardDetailProperties
                        syncWithPageId={page.syncWithPageId}
                        board={board}
                        card={card}
                        cards={cards}
                        activeView={activeView}
                        views={boardViews}
                        readOnly={readOnly}
                        pageUpdatedAt={page.updatedAt.toString()}
                        pageUpdatedBy={page.updatedBy}
                      />
                      <AddBountyButton readOnly={readOnly} cardId={page.id} />
                    </>
                  )}
                  {proposalId && (
                    <ProposalProperties
                      pageId={page.id}
                      proposalId={proposalId}
                      pagePermissions={pagePermissions}
                      snapshotProposalId={page.snapshotProposalId}
                      refreshPagePermissions={refreshPage}
                      readOnly={readonlyProposalProperties}
                      isTemplate={page.type === 'proposal_template'}
                      title={page.title}
                      proposalPage={page}
                    />
                  )}
                  {(draftBounty || page.bountyId) && !isRewardsPage && (
                    <BountyProperties
                      bountyId={page.bountyId}
                      pageId={page.id}
                      pagePath={page.path}
                      readOnly={readOnly}
                      permissions={bountyPermissions}
                      refreshBountyPermissions={() => refreshBountyPermissions()}
                    />
                  )}
                  {page.bountyId && isRewardsPage && (
                    <RewardProperties
                      rewardId={page.bountyId}
                      pageId={page.id}
                      pagePath={page.path}
                      readOnly={readOnly}
                      onClose={close}
                      showApplications
                    />
                  )}
                </CardPropertiesWrapper>
              </CharmEditor>

              {(page.type === 'proposal' || page.type === 'card' || page.type === 'card_synced') &&
                pagePermissions.comment && (
                  <Box mt='-100px'>
                    {/* add negative margin to offset height of .charm-empty-footer */}
                    <PageComments page={page} permissions={pagePermissions} />
                  </Box>
                )}
            </Container>
          </Box>
        </ScrollContainer>
      </div>
    </>
  );
}

export default memo(DocumentPage);
