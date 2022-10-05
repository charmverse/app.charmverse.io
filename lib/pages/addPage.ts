import type { Page } from '@prisma/client';
import type { NextRouter } from 'next/router';
import { mutate } from 'swr';
import { v4 } from 'uuid';

import charmClient from 'charmClient';
import { createBoard } from 'components/common/BoardEditor/focalboard/src/blocks/board';
import { createBoardView } from 'components/common/BoardEditor/focalboard/src/blocks/boardView';
import type { Card } from 'components/common/BoardEditor/focalboard/src/blocks/card';
import { createCard } from 'components/common/BoardEditor/focalboard/src/blocks/card';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { getPagesListCacheKey } from 'hooks/usePages';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';

import type { IPageWithPermissions } from './interfaces';
import { getPagePath } from './utils';

export type NewPageInput = Partial<Page> & { spaceId: string, createdBy: string, shouldCreateDefaultBoardData?: boolean };

interface AddPageResponse {
  board: Board | null;
  view: BoardView | null;
  cards: Card[];
  page: IPageWithPermissions;
}

export async function addPage ({ createdBy, spaceId, shouldCreateDefaultBoardData = true, ...page }: NewPageInput): Promise<AddPageResponse> {

  const pageId = page?.id || v4();

  const isBoardPage = (page.type?.match(/board/));

  const pageProperties: Partial<Page> = {
    id: pageId,
    boardId: isBoardPage ? pageId : undefined,
    content: undefined as any,
    contentText: '',
    createdAt: new Date(),
    createdBy,
    updatedAt: new Date(),
    updatedBy: createdBy,
    path: getPagePath(),
    spaceId,
    title: '',
    type: page.type ?? 'page',
    ...page
  };

  const newPage = await charmClient.createPage(pageProperties);

  const result: AddPageResponse = {
    board: null,
    page: newPage,
    cards: [],
    view: null
  };

  if (isBoardPage) {

    const { board, view, cards } = createDefaultBoardData({ boardId: pageId });

    if (shouldCreateDefaultBoardData) {
      result.board = board;
      result.view = view;
      result.cards = cards;
      await mutator.insertBlocks(
        [board, view],
        'add board'
      );

      // Wait for board creation to succeed before adding cards
      await mutator.insertBlocks(
        [...cards],
        'add cards'
      );
    }
    else {
      result.board = board;
      await mutator.insertBlocks([board]);
    }
  }

  await mutate(getPagesListCacheKey(spaceId), (pages: Record<string, Page>) => {
    return { ...pages, [newPage.id]: newPage };
  }, {
    // revalidate pages for board since we create 3 default ones
    revalidate: Boolean(isBoardPage)
  });

  return result;
}

interface DefaultBoardProps {
  boardId: string;
}

function createDefaultBoardData ({ boardId }: DefaultBoardProps) {

  const board = createBoard({ addDefaultProperty: true });
  board.id = boardId;
  board.rootId = board.id;

  const { cards, view } = createDefaultViewsAndCards({ board });

  return {
    board,
    view,
    cards
  };
}

export function createDefaultViewsAndCards ({ board }: { board: Board }) {

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

  return { view, cards };
}

export async function addPageAndRedirect (page: NewPageInput, router: NextRouter) {
  if (page) {
    const { page: newPage } = await addPage(page);
    router.push(`/${router.query.domain}/${newPage.path}`);
  }
}

