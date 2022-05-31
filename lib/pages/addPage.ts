import { Page, Prisma } from '@prisma/client';
import { mutate } from 'swr';
import charmClient from 'charmClient';
import { NextRouter } from 'next/router';
import { Block } from 'components/common/BoardEditor/focalboard/src/blocks/block';
import { createBoard } from 'components/common/BoardEditor/focalboard/src/blocks/board';
import { createCard, Card } from 'components/common/BoardEditor/focalboard/src/blocks/card';
import { createBoardView } from 'components/common/BoardEditor/focalboard/src/blocks/boardView';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';

export type NewPageInput = Partial<Page> & { spaceId: string, createdBy: string };

export async function addPage ({ createdBy, spaceId, ...page }: NewPageInput): Promise<Page> {
  const id = Math.random().toString().replace('0.', '');
  const pageProperties: Prisma.PageCreateInput = {
    content: undefined as any,
    contentText: '',
    createdAt: new Date(),
    author: {
      connect: {
        id: createdBy
      }
    },
    updatedAt: new Date(),
    updatedBy: createdBy,
    path: `page-${id}`,
    space: {
      connect: {
        id: spaceId
      }
    },
    title: '',
    type: page.type ?? 'page',
    ...(page ?? {})
  };
  if (pageProperties.type === 'board') {
    await createDefaultBoardData(boardId => {
      pageProperties.boardId = boardId;
      pageProperties.id = boardId; // use the same uuid value
    }, pageProperties.id);
  }
  const newPage = await charmClient.createPage(pageProperties);
  await mutate(`pages/${spaceId}`, (pages: Page[]) => {
    return [...pages, newPage];
  }, {
    // revalidate pages for board since we create 3 default ones
    revalidate: pageProperties.type === 'board'
  });
  return newPage;
}

async function createDefaultBoardData (showBoard: (id: string) => void, newBoardId?: string, activeBoardId?: string) {
  const oldBoardId = activeBoardId;
  const board = createBoard({ addDefaultProperty: true });
  if (newBoardId) {
    board.id = newBoardId;
  }
  board.rootId = board.id;

  const view = createBoardView();
  view.fields.viewType = 'board';
  view.parentId = board.id;
  view.rootId = board.rootId;
  view.title = 'Board view';

  const blocks: Card[] = [];

  for (let index = 0; index < 3; index++) {
    const card = createCard();
    card.parentId = board.id;
    card.rootId = board.rootId;
    card.title = `Card ${index + 1}`;
    card.fields.contentOrder = [];
    view.fields.cardOrder.push(card.id);
    blocks.push(card);
  }

  await mutator.insertBlocks(
    [board, view, ...blocks],
    'add board',
    async (newBlocks: Block[]) => {
      // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateBoard, {board: newBoardId})
      showBoard(newBlocks[0].id);
    },
    async () => {
      if (oldBoardId) {
        showBoard(oldBoardId);
      }
    }
  );
}

export async function addPageAndRedirect (page: NewPageInput, router: NextRouter) {
  if (page) {
    const newPage = await addPage(page);
    router.push(`/${router.query.domain}/${newPage.path}`);
  }
}

