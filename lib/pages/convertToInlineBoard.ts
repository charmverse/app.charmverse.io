import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import type { PageUpdater } from 'hooks/usePages';
import type { Board } from 'lib/focalboard/board';

import { createDefaultViewsAndCards } from './addPage';

export async function convertToInlineBoard ({ board, updatePage }: { board: Board, updatePage: PageUpdater }) {
  const { view, cards } = createDefaultViewsAndCards({ board });
  await mutator.insertBlocks(
    [view, ...cards],
    'convert board'
  );

  await updatePage({ id: board.id, type: 'inline_board' }, true);

  return {
    view
  };
}
