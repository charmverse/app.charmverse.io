import type { Block } from 'lib/focalboard/block';
import { createBlock } from 'lib/focalboard/block';

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
