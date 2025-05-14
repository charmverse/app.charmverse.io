import type { PageType } from '@charmverse/core/prisma';

import type { PagesContext } from 'hooks/usePages';

import type { Board } from './board';
import mutator from './mutator';
import { createTableView } from './tableView';

// to create a 'data source', this function just changes the board type to 'inline_board or 'linked_board' and adds a view to it
export async function createNewDataSource({
  board,
  currentPageType,
  updatePage
}: {
  board: Board;
  currentPageType: PageType;
  updatePage: PagesContext['updatePage'];
}) {
  let newPageType = currentPageType;
  if (currentPageType === 'inline_linked_board') {
    newPageType = 'inline_board';
  }
  if (currentPageType === 'linked_board') {
    newPageType = 'board';
  }
  const view = createTableView({ board });
  await mutator.insertBlocks([view], 'convert board');

  await updatePage({ id: board.id, type: newPageType }, true);

  return {
    view
  };
}
