import { useCallback, memo } from 'react';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import { Page, PageContent } from 'models';
import { BountyIntegration } from 'components/bounties/BountyIntegration';
import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import CommentsList from 'components/common/BoardEditor/focalboard/src/components/cardDetail/commentsList';
import { title } from 'process';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getCardComments } from 'components/common/BoardEditor/focalboard/src/store/comments';
import { usePages } from 'hooks/usePages';
import PageHeader from './components/PageHeader';
import PageBanner from './components/PageBanner';
import CharmEditor, { ICharmEditorOutput } from '../../common/CharmEditor/CharmEditor';

export const Container = styled(Box)<{ top: number }>`
  width: 860px;
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

export interface IEditorProps {
  page: Page, setPage: (p: Partial<Page>) => void, readOnly?: boolean }

function Editor ({ page, setPage, readOnly = false }: IEditorProps) {
  const { pages } = usePages();
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

  const updatePageContent = useCallback((content: ICharmEditorOutput) => {
    setPage({ content: content.doc, contentText: content.rawText });
  }, [setPage]);

  const card = cards.find(_card => _card.id === page.id);

  const comments = card ? useAppSelector(getCardComments(card.id)) : [];

  return (
    <ScrollableWindow>
      {page.headerImage && <PageBanner headerImage={page.headerImage} setPage={setPage} />}
      <Container
        top={pageTop}
      >
        <CharmEditor
          key={page.id}
          content={page.content as PageContent}
          onContentChange={updatePageContent}
          readOnly={readOnly}
        >
          <PageHeader
            headerImage={page.headerImage}
            icon={page.icon}
            title={page.title}
            readOnly={readOnly}
            setPage={setPage}
          />
          {card && board && (
          <div className='CardDetail content'>
            {/* Property list */}
            <Box sx={{
              display: 'flex',
              gap: 1,
              justifyContent: 'space-between',
              width: '100%'
            }}
            >
              <CardDetailProperties
                board={board}
                card={card}
                cards={cards}
                pageUpdatedAt={page.updatedAt.toString()}
                pageUpdatedBy={page.updatedBy}
                activeView={activeView}
                views={boardViews}
                readonly={readOnly}
              />
              <BountyIntegration linkedTaskId={card.id} title={title} readonly={readOnly} />
            </Box>

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
      </Container>
    </ScrollableWindow>
  );
}

export default memo(Editor);
