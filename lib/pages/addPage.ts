import { Page } from '@prisma/client';
import charmClient from 'charmClient';
import { Block } from 'components/common/BoardEditor/focalboard/src/blocks/block';
import { createBoard } from 'components/common/BoardEditor/focalboard/src/blocks/board';
import { createBoardView } from 'components/common/BoardEditor/focalboard/src/blocks/boardView';
import { Card, createCard } from 'components/common/BoardEditor/focalboard/src/blocks/card';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { NextRouter } from 'next/router';
import { mutate } from 'swr';
import { v4 } from 'uuid';

export type NewPageInput = Partial<Page> & { spaceId: string, createdBy: string };

export async function addPage ({ createdBy, spaceId, ...page }: NewPageInput): Promise<Page> {
  const id = v4();

  const pageProperties: Partial<Page> = {
    id,
    boardId: page.type === 'board' ? id : undefined,
    content: undefined as any,
    contentText: '',
    createdAt: new Date(),
    createdBy,
    updatedAt: new Date(),
    updatedBy: createdBy,
    path: `page-${id}`,
    spaceId,
    title: '',
    type: page.type ?? 'page',
    ...(page ?? {})
  };

  const newPage = await charmClient.createPage(pageProperties);

  if (pageProperties.type === 'board') {
    await createDefaultBoardData(() => null, id);
  }

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

