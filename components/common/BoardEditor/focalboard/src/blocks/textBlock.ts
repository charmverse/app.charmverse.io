import type { ContentBlock } from './contentBlock';
import type { Block } from './block';
import { createBlock } from './block';

export type TextBlock = ContentBlock & {
    type: 'text';
}

function createTextBlock (block?: Block): TextBlock {
  return {
    ...createBlock(block),
    type: 'text'
  };
}

export { createTextBlock };
