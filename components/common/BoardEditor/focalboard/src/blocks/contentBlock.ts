import type { Block } from './block';
import { createBlock } from './block';

type IContentBlockWithCords = {
    block: Block;
    cords: { x: number, y?: number, z?: number };
}

type ContentBlock = Block

const createContentBlock = createBlock;

export { createContentBlock };
export type { ContentBlock, IContentBlockWithCords };
