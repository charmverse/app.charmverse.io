import type { Block } from 'lib/focalboard/block';
import { createBlock } from 'lib/focalboard/block';

type IContentBlockWithCords = {
  block: Block;
  cords: { x: number; y?: number; z?: number };
};

type ContentBlock = Block;

const createContentBlock = createBlock;

export { createContentBlock };
export type { ContentBlock, IContentBlockWithCords };
