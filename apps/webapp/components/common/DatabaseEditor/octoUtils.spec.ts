import type { UIBlockWithDetails } from '@packages/databases/block';

import { OctoUtils } from './octoUtils';
import { TestBlockFactory } from './test/testBlockFactory';

test('duplicateBlockTree: Board', async () => {
  const [blocks, sourceBlock] = createBoardTree();

  const [newBlocks, newSourceBlock, idMap] = OctoUtils.duplicateBlockTree(blocks, sourceBlock.id);

  expect(newBlocks.length).toBe(blocks.length);
  expect(newSourceBlock.id).not.toBe(sourceBlock);
  expect(newSourceBlock.type).toBe(sourceBlock.type);

  // When duplicating a root block, the rootId should be re-mapped
  expect(newSourceBlock.rootId).not.toBe(sourceBlock.rootId);
  expect(idMap[sourceBlock.id]).toBe(newSourceBlock.id);

  for (const newBlock of newBlocks) {
    expect(newBlock.rootId).toBe(newSourceBlock.id);
  }

  for (const textBlock of newBlocks.filter((o) => o.type === 'card')) {
    expect(textBlock.parentId).toBe(newSourceBlock.id);
  }
});

test('duplicateBlockTree: Card', async () => {
  const [blocks, sourceBlock] = createCardTree();

  const [newBlocks, newSourceBlock, idMap] = OctoUtils.duplicateBlockTree(blocks, sourceBlock.id);

  expect(newBlocks.length).toBe(blocks.length);
  expect(newSourceBlock.id).not.toBe(sourceBlock.id);
  expect(newSourceBlock.type).toBe(sourceBlock.type);

  // When duplicating a non-root block, the rootId should not be re-mapped
  expect(newSourceBlock.rootId).toBe(sourceBlock.rootId);
  expect(idMap[sourceBlock.id]).toBe(newSourceBlock.id);

  for (const newBlock of newBlocks) {
    expect(newBlock.rootId).toBe(newSourceBlock.rootId);
  }
});

function createBoardTree(): [UIBlockWithDetails[], UIBlockWithDetails] {
  const blocks: UIBlockWithDetails[] = [];

  const board = TestBlockFactory.createBoard();
  board.id = 'board1';
  board.rootId = board.id;
  blocks.push(board);

  for (let i = 0; i < 5; i++) {
    const card = TestBlockFactory.createCard(board);
    card.id = `card${i}`;
    blocks.push(card);
  }

  return [blocks, board];
}

function createCardTree(): [UIBlockWithDetails[], UIBlockWithDetails] {
  const blocks: UIBlockWithDetails[] = [];

  const card = TestBlockFactory.createCard();
  card.id = 'card1';
  card.rootId = 'board1';
  blocks.push(card);

  return [blocks, card];
}
