import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import CommentsList from 'components/common/BoardEditor/focalboard/src/components/cardDetail/commentsList';
import { getCardComments } from 'components/common/BoardEditor/focalboard/src/store/comments';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { usePages } from 'hooks/usePages';
import { useVotes } from 'hooks/useVotes';
import { BountyWithDetails, Page, PageContent } from 'models';
import { useRouter } from 'next/router';
import { memo, useCallback } from 'react';
import VoteDetail from 'components/common/CharmEditor/components/inlineVote/components/VoteDetail';
import { useBounties } from 'hooks/useBounties';
import CharmEditor, { ICharmEditorOutput } from '../../common/CharmEditor/CharmEditor';
import PageBanner from './components/PageBanner';
import PageDeleteBanner from './components/PageDeleteBanner';
import PageHeader from './components/PageHeader';
import CreateVoteBox from './components/CreateVoteBox';
import BountyProperties from './components/BountyProperties';

export const Container = styled(Box)<{ top: number, fullWidth?: boolean }>`
  width: ${({ fullWidth }) => fullWidth ? '100%' : '860px'};
  max-width: 100%;
  margin: 0 auto ${({ top }) => top + 100}px;
  position: relative;
  top: ${({ top }) => top}px;
  padding-bottom: ${({ theme }) => theme.spacing(5)};

  padding: 0 40px;
  @media (min-width: 975px) {
    padding: 0 80px;
  }
`;

export interface DocumentPageProps {
  page: Page, setPage: (p: Partial<Page>) => void, readOnly?: boolean, insideModal?: boolean
}

function DocumentPage ({ page, setPage, insideModal, readOnly = false }: DocumentPageProps) {
  const { pages } = usePages();
  const { cancelVote, castVote, deleteVote, votes, isLoading } = useVotes();
  const { bounties } = useBounties();
  const cardId = (new URLSearchParams(window.location.search)).get('cardId');
  const bounty = bounties.find(_bounty => _bounty.linkedTaskId === cardId);
  const pageVote = Object.values(votes)[0];

  const board = useAppSelector((state) => {
    if (page.type === 'card' && page.parentId) {
      const parentPage = pages[page.parentId];
      return parentPage?.boardId && parentPage?.type === 'board' ? state.boards.boards[parentPage.boardId] : null;
    }
    return null;
  });
  const cards = useAppSelector((state) => board ? Object.values(state.cards.cards).filter(card => card.parentId === board.id) : []);
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

  const { currentPageActionDisplay } = usePageActionDisplay();

  const updatePageContent = useCallback((content: ICharmEditorOutput) => {
    setPage({ content: content.doc, contentText: content.rawText });
  }, [setPage]);

  const card = cards.find(_card => _card.id === page.id);

  const comments = useAppSelector(getCardComments(card?.id));

  const showPageActionSidebar = (currentPageActionDisplay !== null) && !insideModal;
  const router = useRouter();
  const isSharedPage = router.pathname.startsWith('/share');

  return (
    <ScrollableWindow hideScroll={showPageActionSidebar}>
      <div style={{
        width: showPageActionSidebar ? 'calc(100% - 425px)' : '100%',
        height: showPageActionSidebar ? 'calc(100vh - 65px)' : '100%',
        overflow: showPageActionSidebar ? 'auto' : 'inherit'
      }}
      >
        {page.deletedAt && <PageDeleteBanner pageId={page.id} />}
        {page.headerImage && <PageBanner headerImage={page.headerImage} setPage={setPage} />}
        <Container
          top={pageTop}
          fullWidth={page.fullWidth ?? false}
        >
          <CharmEditor
            key={page.id}
            content={page.content as PageContent}
            onContentChange={updatePageContent}
            readOnly={readOnly}
            pageActionDisplay={!insideModal ? currentPageActionDisplay : null}
            pageId={page.id}
            disablePageSpecificFeatures={isSharedPage}
            enableVoting={page.type !== 'proposal'}
          >
            <PageHeader
              headerImage={page.headerImage}
              icon={page.icon}
              title={page.title}
              readOnly={readOnly}
              setPage={setPage}
            />
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
            {card && board && (
              <div className='CardDetail content'>
                {/* Property list */}
                <CardDetailProperties
                  board={board}
                  card={card}
                  cards={cards}
                  activeView={activeView}
                  views={boardViews}
                  readonly={readOnly}
                  pageUpdatedAt={page.updatedAt.toString()}
                  pageUpdatedBy={page.updatedBy}
                />
                {bounty && (
                <>
                  <hr />
                  <BountyProperties bounty={bounty} readOnly={readOnly} />
                </>
                )}
                <hr />
                <CommentsList
                  comments={comments}
                  rootId={card.rootId}
                  cardId={card.id}
                  readonly={readOnly}
                />

              </div>
            )}
          </CharmEditor>
          {page.type === 'proposal' && !isLoading && !pageVote && (
            <CreateVoteBox />
          )}
        </Container>
      </div>
    </ScrollableWindow>
  );
}

export default memo(DocumentPage);
