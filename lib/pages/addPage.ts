import type { PageWithPermissions } from '@charmverse/core/pages';
import type { Page } from '@charmverse/core/prisma';
import type { Board } from '@root/lib/databases/board';
import { createBoard } from '@root/lib/databases/board';
import type { BoardView } from '@root/lib/databases/boardView';
import type { Card } from '@root/lib/databases/card';
import { createTableView } from '@root/lib/databases/tableView';
import type { PageCreated } from '@root/lib/websockets/interfaces';
import { mutate } from 'swr';
import { v4 } from 'uuid';

import charmClient from 'charmClient';
import mutator from 'components/common/DatabaseEditor/mutator';
import { getPagesListCacheKey } from 'hooks/usePages';
import { emitSocketMessage } from 'hooks/useWebSocketClient';

import { getPagePath } from './utils';

export type NewPageInput = Partial<Page> & {
  spaceId: string;
  createdBy: string;
};

interface AddPageResponse {
  board: Board | null;
  view: BoardView | null;
  cards: Card[];
  page: PageWithPermissions;
}

type CreatedPage = Pick<Page, 'id' | 'path'>;

async function addDatabasePage(newPage: PageWithPermissions) {
  const isBoardPage = newPage.type?.match(/board/);
  const result: AddPageResponse = {
    board: null,
    page: newPage,
    cards: [],
    view: null
  };

  if (isBoardPage) {
    const { board } = createDefaultBoardData({ boardId: newPage.id });
    result.board = board;
    await mutator.insertBlocks([board]);
  }

  await mutate(
    getPagesListCacheKey(newPage.spaceId),
    (pages: Record<string, Page> | undefined) => {
      return { ...pages, [newPage.id]: newPage };
    },
    {
      revalidate: false
    }
  );

  return result;
}

export async function addPage(
  { createdBy, spaceId, ...page }: NewPageInput,
  { cb, trigger }: { trigger: 'sidebar' | 'editor'; cb?: (page: CreatedPage) => void }
) {
  const pageId = page?.id || v4();
  const isBoardPage = page.type?.match(/board/);
  const pageProperties: Partial<Page> = {
    id: pageId,
    boardId: isBoardPage ? pageId : undefined,
    content: undefined,
    contentText: '',
    createdAt: new Date(),
    createdBy,
    updatedAt: new Date(),
    updatedBy: createdBy,
    path: getPagePath(),
    spaceId,
    title: '',
    type: 'page',
    ...page
  };

  // Only emit socket message if we are creating a board or page from the sidebar
  // Adding condition for checking page type since card pages can also be added from the sidebar but it should be created via the api
  if (
    (page.type === 'board' || page.type === 'page' || page.type === 'linked_board') &&
    trigger === 'sidebar' &&
    page.parentId
  ) {
    emitSocketMessage<PageWithPermissions>(
      {
        type: 'page_created',
        payload: pageProperties as PageCreated['payload']
      },
      async (newPage) => {
        if (cb) {
          cb(newPage);
        }
        await addDatabasePage(newPage);
      }
    );
  } else {
    // For creating board and other pages from the editor use the api
    const newPage = await charmClient.createPage(pageProperties);
    // call back immediately to update UI while db is created
    if (cb) {
      cb(newPage);
    }
    await addDatabasePage(newPage);
  }
}

interface DefaultBoardProps {
  boardId: string;
}

function createDefaultBoardData({ boardId }: DefaultBoardProps) {
  const board = createBoard();
  board.id = boardId;
  board.rootId = board.id;

  const view = createTableView({ board });

  return {
    board,
    view,
    cards: []
  };
}

export async function addPageAndRedirect(page: NewPageInput, callback: (path: string) => void) {
  if (page) {
    await addPage(page, {
      trigger: 'sidebar',
      cb: (newPage) => callback(`/${newPage.path}`)
    });
  }
}
