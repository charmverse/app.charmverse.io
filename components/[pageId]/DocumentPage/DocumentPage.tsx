import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { memo, useCallback, useEffect, useState } from 'react';
import { useElementSize } from 'usehooks-ts';

import charmClient from 'charmClient';
import AddBountyButton from 'components/common/BoardEditor/focalboard/src/components/cardDetail/AddBountyButton';
import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import CommentsList from 'components/common/BoardEditor/focalboard/src/components/cardDetail/commentsList';
import { getCardComments } from 'components/common/BoardEditor/focalboard/src/store/comments';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import { SnapshotVoteDetails } from 'components/common/CharmEditor/components/inlineVote/components/SnapshotVoteDetails';
import VoteDetail from 'components/common/CharmEditor/components/inlineVote/components/VoteDetail';
import LoadingComponent from 'components/common/LoadingComponent';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import { useBounties } from 'hooks/useBounties';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { usePageDetails } from 'hooks/usePageDetails';
import { usePages } from 'hooks/usePages';
import { usePrimaryCharmEditor } from 'hooks/usePrimaryCharmEditor';
import { useVotes } from 'hooks/useVotes';
import type { AssignedBountyPermissions } from 'lib/bounties';
import type { PageMeta } from 'lib/pages';
import type { Page, PageContent } from 'models';

import BountyProperties from './components/BountyProperties';
import PageBanner from './components/PageBanner';
import PageDeleteBanner from './components/PageDeleteBanner';
import PageHeader from './components/PageHeader';
import { PageTemplateBanner } from './components/PageTemplateBanner';
import { ProposalProperties } from './components/ProposalProperties';

const CharmEditor = dynamic(() => import('components/common/CharmEditor'), {
  ssr: false
});

export const Container = styled(Box)<{ top: number, fullWidth?: boolean }>`
  width: ${({ fullWidth }) => fullWidth ? '100%' : '860px'};
  max-width: 100%;
  margin: 0 auto ${({ top }) => top + 100}px;
  position: relative;
  top: ${({ top }) => top}px;
  padding: ${({ theme }) => theme.spacing(0, 3)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    padding: 0 80px;
  }
`;

export interface DocumentPageProps {
  page: PageMeta;
  setPage: (p: Partial<Page>) => void;
  readOnly?: boolean;
  insideModal?: boolean;
  parentProposalId?: string | null;
}

function DocumentPage ({ page, setPage, insideModal, readOnly = false, parentProposalId }: DocumentPageProps) {
  const { pages, getPagePermissions } = usePages();
  const { cancelVote, castVote, deleteVote, votes, isLoading } = useVotes();
  const pagePermissions = getPagePermissions(page.id);
  const { pageDetails, debouncedUpdatePageDetails } = usePageDetails(page.id);

  const { draftBounty } = useBounties();
  const { currentPageActionDisplay } = usePageActionDisplay();
  const { editMode } = usePrimaryCharmEditor();

  // Only populate bounty permission data if this is a bounty page
  const [bountyPermissions, setBountyPermissions] = useState<AssignedBountyPermissions | null>(null);
  const [containerRef, { width: containerWidth }] = useElementSize();

  const proposalId = page.proposalId || parentProposalId;
  // We can only edit the proposal from the top level
  const readonlyProposalProperties = !page.proposalId || Boolean(parentProposalId) || readOnly;

  async function refreshBountyPermissions (bountyId: string) {
    setBountyPermissions(await charmClient.bounties.computePermissions({
      resourceId: bountyId
    }));
  }

  useEffect(() => {
    if (page.bountyId) {
      refreshBountyPermissions(page.bountyId);
    }
  }, [page.bountyId]);

  const cannotComment = readOnly || !pagePermissions?.comment;
  const enableSuggestingMode = editMode === 'suggesting' && !readOnly && pagePermissions?.comment;

  const pageVote = Object.values(votes).find(v => v.context === 'proposal');

  const board = useAppSelector((state) => {
    if ((page.type === 'card' || page.type === 'card_template') && page.parentId) {
      const parentPage = pages[page.parentId];
      return parentPage?.boardId && (parentPage?.type.match(/board/)) ? state.boards.boards[parentPage.boardId] : null;
    }
    return null;
  });
  const cards = useAppSelector((state) => {
    return board ? [...Object.values(state.cards.cards), ...Object.values(state.cards.templates)].filter(card => card.parentId === board.id) : [];
  });
  const boardViews = useAppSelector((state) => {
    if (board) {
      return Object.values(state.views.views).filter(view => view.parentId === board.id);
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
  }
  else if (page.icon) {
    pageTop = 200;
  }

  const updatePageContent = useCallback((content: ICharmEditorOutput) => {
    debouncedUpdatePageDetails({ id: page.id, content: content.doc, contentText: content.rawText });
    // setPage({ content: content.doc, contentText: content.rawText });
  }, [setPage]);

  const card = cards.find(_card => _card.id === page.id);

  const comments = useAppSelector(getCardComments(card?.id ?? page.id));

  const showPageActionSidebar = (currentPageActionDisplay !== null) && !insideModal;
  const router = useRouter();
  const isSharedPage = router.pathname.startsWith('/share');

  return (
    <ScrollableWindow
      sx={{
        overflow: {
          md: showPageActionSidebar ? 'hidden' : 'auto'
        }
      }}
    >
      <Box
        id='document-scroll-container'
        sx={{
          transition: 'width ease-in 0.25s',
          width: {
            md: showPageActionSidebar ? 'calc(100% - 430px)' : '100%'
          },
          height: {
            md: showPageActionSidebar ? 'calc(100vh - 65px)' : '100%'
          },
          overflow: {
            md: showPageActionSidebar ? 'auto' : 'inherit'
          }
        }}
      >
        <div ref={containerRef}>
          {page.deletedAt && <PageDeleteBanner pageId={page.id} />}
          <PageTemplateBanner parentPage={page.parentId ? pages[page.parentId] : null} page={page} />
          {/* temporary? disable editing of page meta data when in suggestion mode */}
          {page.headerImage && <PageBanner headerImage={page.headerImage} readOnly={readOnly || enableSuggestingMode} setPage={setPage} />}
          <Container
            top={pageTop}
            fullWidth={page.fullWidth ?? false}
          >
            <CharmEditor
              key={page.id + editMode + !!pageDetails}
              content={pageDetails?.content as PageContent}
              onContentChange={updatePageContent}
              readOnly={readOnly || !pageDetails}
              pageActionDisplay={!insideModal ? currentPageActionDisplay : null}
              pageId={page.id}
              disablePageSpecificFeatures={isSharedPage}
              enableSuggestingMode={enableSuggestingMode}
              enableVoting={true}
              containerWidth={containerWidth}
              pageType={page.type}
              pagePermissions={pagePermissions}
              placeholder={!pageDetails ? <LoadingComponent isLoading /> : null}
            >
              {/* temporary? disable editing of page title when in suggestion mode */}
              <PageHeader
                headerImage={page.headerImage}
                // Commented for now, as we need to preserve cursor position between re-renders caused by updating this
                // key={page.title}
                icon={page.icon}
                title={page.title}
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
      </Box>
    </ScrollableWindow>
  );
}

export default memo(DocumentPage);
