import type { UIBlockWithDetails } from '@root/lib/databases/block';
import type { Board } from '@root/lib/databases/board';
import type { BoardView } from '@root/lib/databases/boardView';
import type { Card } from '@root/lib/databases/card';

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
