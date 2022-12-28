import type { PageType } from '@prisma/client';

import { createTableView } from 'components/common/BoardEditor/focalboard/src/components/addViewMenu';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import type { PageUpdater } from 'hooks/usePages';
import type { Board } from 'lib/focalboard/board';

// to create a 'data source', this function just changes the board type to 'inline_board or 'linked_board' and adds a view to it
export async function createNewDataSource({
  board,
  type,
  updatePage
}: {
  board: Board;
  type: PageType;
  updatePage: PageUpdater;
}) {
  const view = createTableView(board);
  await mutator.insertBlocks([view], 'convert board');

  await updatePage({ id: board.id, type }, true);

  return {
    view
  };
}
