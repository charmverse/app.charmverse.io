import { TestBlockFactory } from 'components/common/BoardEditor/focalboard/src/test/testBlockFactory';
import type { Board } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';

export function createMockBoard(): Board {
  return TestBlockFactory.createBoard();
}

export function createMockCard(board?: Board): Card {
  return TestBlockFactory.createCard(board);
}
