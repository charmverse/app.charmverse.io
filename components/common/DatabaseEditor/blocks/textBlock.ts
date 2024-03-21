import type { Block } from 'lib/databases/block';
import { createBlock } from 'lib/databases/block';

import type { ContentBlock } from './contentBlock';

export type TextBlock = ContentBlock & {
  type: 'text';
};

function createTextBlock(block?: Block): TextBlock {
  return {
    ...createBlock(block),
    type: 'text'
  };
}

export { createTextBlock };
