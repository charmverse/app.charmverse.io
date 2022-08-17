import { Page } from '@prisma/client';
import charmClient from 'charmClient';
import { Block } from 'components/common/BoardEditor/focalboard/src/blocks/block';
import { createBoard } from 'components/common/BoardEditor/focalboard/src/blocks/board';
import { createBoardView } from 'components/common/BoardEditor/focalboard/src/blocks/boardView';
import { Card, createCard } from 'components/common/BoardEditor/focalboard/src/blocks/card';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { Board } from 'lib/focalboard/board';
import { BoardView } from 'lib/focalboard/boardView';
import { NextRouter } from 'next/router';
import { mutate } from 'swr';
import { v4 } from 'uuid';

export type NewPageInput = Partial<Page> & { spaceId: string, createdBy: string };

export async function addPage ({ createdBy, spaceId, ...page }: NewPageInput) {
  const id = v4();

  const pageProperties: Partial<Page> = {
    id,
    boardId: (page.type === 'board' || page.type === 'inline_board') ? id : undefined,
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

  const pageArtifacts: {
    board: Board | null
    view: BoardView | null
    cards: Card[]
    page: Page
  } = {
    board: null,
    page: newPage,
    cards: [],
    view: null
  };
  if (pageProperties.type === 'board' || pageProperties.type === 'inline_board') {
    const artifacts = await createDefaultBoardData(() => null, id);
    pageArtifacts.board = artifacts.board;
    pageArtifacts.view = artifacts.view;
    pageArtifacts.cards = artifacts.cards;
  }

  await mutate(`pages/${spaceId}`, (pages: Page[]) => {
    return [...pages, newPage];
  }, {
    // revalidate pages for board since we create 3 default ones
    revalidate: pageProperties.type === 'board' || pageProperties.type === 'inline_board'
  });

  return pageArtifacts;
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

  const cards: Card[] = [];

  for (let index = 0; index < 3; index++) {
    const card = createCard();
    card.parentId = board.id;
    card.rootId = board.rootId;
    card.title = `Card ${index + 1}`;
    card.fields.contentOrder = [];
    view.fields.cardOrder.push(card.id);
    cards.push(card);
  }

  await mutator.insertBlocks(
    [board, view, ...cards],
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

  return {
    board,
    view,
    cards
  };
}

export async function addPageAndRedirect (page: NewPageInput, router: NextRouter) {
  if (page) {
    const { page: newPage } = await addPage(page);
    router.push(`/${router.query.domain}/${newPage.path}`);
  }
}

