import type { Block } from './block';
import { createBlock } from './block';
import type { ContentBlock } from './contentBlock';

type DividerBlock = ContentBlock & {
    type: 'divider';
}

function createDividerBlock (block?: Block): DividerBlock {
  return {
    ...createBlock(block),
    type: 'divider'
  };
}

export { createDividerBlock };
export type { DividerBlock };
