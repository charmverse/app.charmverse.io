import styled from '@emotion/styled';
import { useMediaQuery } from '@mui/material';
import type { Theme } from '@mui/material';
import Box from '@mui/material/Box';
import type { Page } from '@prisma/client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { memo, useEffect, useState } from 'react';
import { useElementSize } from 'usehooks-ts';

import charmClient from 'charmClient';
import AddBountyButton from 'components/common/BoardEditor/focalboard/src/components/cardDetail/AddBountyButton';
import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import CommentsList from 'components/common/BoardEditor/focalboard/src/components/cardDetail/commentsList';
import { getCardComments } from 'components/common/BoardEditor/focalboard/src/store/comments';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import type { FrontendParticipant } from 'components/common/CharmEditor/components/fiduswriter/collab';
import { SnapshotVoteDetails } from 'components/common/CharmEditor/components/inlineVote/components/SnapshotVoteDetails';
import VoteDetail from 'components/common/CharmEditor/components/inlineVote/components/VoteDetail';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import { useBounties } from 'hooks/useBounties';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { usePages } from 'hooks/usePages';
import { useVotes } from 'hooks/useVotes';
import type { AssignedBountyPermissions } from 'lib/bounties';
import type { PageMeta } from 'lib/pages';

import BountyProperties from './components/BountyProperties';
import PageBanner from './components/PageBanner';
import PageDeleteBanner from './components/PageDeleteBanner';
import PageHeader from './components/PageHeader';
import { PageTemplateBanner } from './components/PageTemplateBanner';
import { ProposalProperties } from './components/ProposalProperties';

const CharmEditor = dynamic(() => import('components/common/CharmEditor'), {
  ssr: false
});

export const Container = styled(({ fullWidth, ...props }: any) => <Box {...props} />)<{
  top: number;
  fullWidth?: boolean;
}>`
  width: ${({ fullWidth }) => (fullWidth ? '100%' : '860px')};
  max-width: 100%;
  margin: 0 auto ${({ top }) => top + 100}px;
  position: relative;
  top: ${({ top }) => top}px;
  padding: 0 40px 0 30px;

  ${({ theme }) => theme.breakpoints.up('sm')} {
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

const StyledBannerContainer = styled.div<{ showPageActionSidebar: boolean }>(
  ({ showPageActionSidebar, theme }) => `
  transition: width ease-in 0.25s;
  ${theme.breakpoints.up('lg')} {
    width: ${showPageActionSidebar ? 'calc(100% - 430px)' : '100%'};
  }
`
);

export interface DocumentPageProps {
  page: PageMeta;
  setPage: (p: Partial<Page>) => void;
  readOnly?: boolean;
  insideModal?: boolean;
  parentProposalId?: string | null;
}

function DocumentPage({ page, setPage, insideModal, readOnly = false, parentProposalId }: DocumentPageProps) {
  const { pages, getPagePermissions } = usePages();
  const { cancelVote, castVote, deleteVote, updateDeadline, votes, isLoading } = useVotes();
  // For post we would artificially construct the permissions
  const pagePermissions = getPagePermissions(page.id);
  const { draftBounty } = useBounties();
  const { currentPageActionDisplay } = usePageActionDisplay();
  const { editMode, setPageProps } = useCharmEditor();
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));

  // Only populate bounty permission data if this is a bounty page
  const [bountyPermissions, setBountyPermissions] = useState<AssignedBountyPermissions | null>(null);
  const [containerRef, { width: containerWidth }] = useElementSize();

  const proposalId = page.proposalId || parentProposalId;
  // We can only edit the proposal from the top level
  const readonlyProposalProperties = !page.proposalId || Boolean(parentProposalId) || readOnly;

  async function refreshBountyPermissions(bountyId: string) {
    setBountyPermissions(
      await charmClient.bounties.computePermissions({
        resourceId: bountyId
      })
    );
  }

  useEffect(() => {
    if (page.bountyId) {
      refreshBountyPermissions(page.bountyId);
    }
  }, [page.bountyId]);

  const cannotComment = readOnly || !pagePermissions?.comment;

  const enableSuggestingMode = editMode === 'suggesting' && !readOnly && !!pagePermissions?.comment;

  const pageVote = Object.values(votes).find((v) => v.context === 'proposal');

  // const cards = useAppSelector((state) => {
  //   return board
  //     ? [...Object.values(state.cards.cards), ...Object.values(state.cards.templates)].filter(
  //         (card) => card.parentId === board.id
  //       )
  //     : [];
  // });
  const card = useAppSelector((state) => {
    if (page.cardId) {
      return state.cards.cards[page.cardId] ?? state.cards.templates[page.cardId] ?? null;
    }
    return null;
  });

  const board = useAppSelector((state) => {
    return card ? state.boards.boards[card.parentId] : null;
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

  const activeView = boardViews[0];

  let pageTop = 100;
  if (page.headerImage) {
    pageTop = 50;
    if (page.icon) {
      pageTop = 80;
    }
  } else if (page.icon) {
    pageTop = 200;
  }

  const comments = useAppSelector(getCardComments(page.cardId ?? page.id));

  const showPageActionSidebar = currentPageActionDisplay !== null && !insideModal;
  const router = useRouter();
  const isSharedPage = router.pathname.startsWith('/share');

  function onParticipantUpdate(participants: FrontendParticipant[]) {
    setPageProps({ participants });
  }

  return (
    <>
      {!!page?.deletedAt && (
        <StyledBannerContainer showPageActionSidebar={showPageActionSidebar}>
          <PageDeleteBanner pageId={page.id} />
        </StyledBannerContainer>
      )}
      <ScrollableWindow
        sx={{
          overflow: {
            md: showPageActionSidebar ? 'hidden' : 'auto'
          }
        }}
      >
        <ScrollContainer id='document-scroll-container' showPageActionSidebar={showPageActionSidebar}>
          <div ref={containerRef}>
            <PageTemplateBanner parentPage={page.parentId ? pages[page.parentId] : null} page={page} />
            {/* temporary? disable editing of page meta data when in suggestion mode */}
            {page.headerImage && (
              <PageBanner
                headerImage={page.headerImage}
                readOnly={readOnly || enableSuggestingMode}
                setPage={setPage}
              />
            )}
            <Container top={pageTop} fullWidth={isSmallScreen || (page.fullWidth ?? false)}>
              <CharmEditor
                key={page.id + editMode}
                // content={pageDetails?.content as PageContent}
                // onContentChange={updatePageContent}
                readOnly={readOnly}
                autoFocus={false}
                pageActionDisplay={!insideModal ? currentPageActionDisplay : null}
                pageId={page.id}
                disablePageSpecificFeatures={isSharedPage}
                enableSuggestingMode={enableSuggestingMode}
                enableVoting={true}
                containerWidth={containerWidth}
                pageType={page.type}
                pagePermissions={pagePermissions ?? undefined}
                onParticipantUpdate={onParticipantUpdate}
              >
                {/* temporary? disable editing of page title when in suggestion mode */}
                <PageHeader
                  headerImage={page.headerImage}
                  // Commented for now, as we need to preserve cursor position between re-renders caused by updating this
                  // key={page.title}
                  icon={page.icon}
                  title={page.title}
                  updatedAt={page.updatedAt.toString()}
                  readOnly={readOnly || enableSuggestingMode}
                  setPage={setPage}
                />
                {page.type === 'proposal' && !isLoading && page.snapshotProposalId && (
                  <Box my={2}>
                    <SnapshotVoteDetails snapshotProposalId={page.snapshotProposalId} />
                  </Box>
                )}
                {page.type === 'proposal' && !isLoading && pageVote && (
                  <Box my={2}>
                    <VoteDetail
                      cancelVote={cancelVote}
                      deleteVote={deleteVote}
                      castVote={castVote}
                      updateDeadline={updateDeadline}
                      vote={pageVote}
                      detailed={false}
                      isProposal={true}
                    />
                  </Box>
                )}
                <div className='focalboard-body'>
                  <div className='CardDetail content'>
                    {/* Property list */}
                    {card && board && (
                      <>
                        <CardDetailProperties
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
                        pageId={proposalId}
                        proposalId={proposalId}
                        readOnly={readonlyProposalProperties}
                        isTemplate={page.type === 'proposal_template'}
                      />
                    )}
                    {(draftBounty || page.bountyId) && (
                      <BountyProperties
                        bountyId={page.bountyId}
                        pageId={page.id}
                        readOnly={readOnly}
                        permissions={bountyPermissions}
                        refreshBountyPermissions={refreshBountyPermissions}
                      />
                    )}
                    {(page.type === 'bounty' || page.type === 'card') && (
                      <CommentsList
                        comments={comments}
                        rootId={card?.rootId ?? page.id}
                        cardId={card?.id ?? page.id}
                        readOnly={cannotComment}
                      />
                    )}
                  </div>
                </div>
              </CharmEditor>
            </Container>
          </div>
        </ScrollContainer>
      </ScrollableWindow>
    </>
  );
}

export default memo(DocumentPage);
