import type { UIBlockWithDetails } from '@packages/databases/block';
import type { Board } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import type { Card } from '@packages/databases/card';

import { TestBlockFactory } from 'components/common/DatabaseEditor/test/testBlockFactory';

export function createMockBoard(): Board {
  return TestBlockFactory.createBoard();
}

export function createMockCard(board?: Board): Card {
  return TestBlockFactory.createCard(board);
}

export function createMockView(view?: Partial<UIBlockWithDetails>, board?: Board): BoardView {
  const mocked = TestBlockFactory.createBoardView(board);
  if (view) {
    view.fields = { ...mocked.fields, ...view.fields };
    Object.assign(mocked, view);
  }
  return mocked;
}
