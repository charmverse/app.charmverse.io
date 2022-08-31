import { Block, createBlock } from './block';
import { ContentBlock } from './contentBlock';

type DividerBlock = ContentBlock & {
    type: 'divider'
}

function createDividerBlock (block?: Block): DividerBlock {
  return {
    ...createBlock(block),
    type: 'divider'
  };
}

export { createDividerBlock };
export type { DividerBlock };
