import type { Block } from 'lib/databases/block';
import { createBlock } from 'lib/databases/block';

type IContentBlockWithCords = {
  block: Block;
  cords: { x: number; y?: number; z?: number };
};

type ContentBlock = Block;

const createContentBlock = createBlock;

export { createContentBlock };
export type { ContentBlock, IContentBlockWithCords };
