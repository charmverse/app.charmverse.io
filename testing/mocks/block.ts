import { TestBlockFactory } from 'components/common/DatabaseEditor/test/testBlockFactory';
import type { UIBlockWithDetails } from 'lib/databases/block';
import type { Board } from 'lib/databases/board';
import type { BoardView } from 'lib/databases/boardView';
import type { Card } from 'lib/databases/card';

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
