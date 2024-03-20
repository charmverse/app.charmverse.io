import type { Block } from 'lib/databases/block';
import { createBlock } from 'lib/databases/block';

import type { ContentBlock } from './contentBlock';

type DividerBlock = ContentBlock & {
  type: 'divider';
};

function createDividerBlock(block?: Block): DividerBlock {
  return {
    ...createBlock(block),
    type: 'divider'
  };
}

export { createDividerBlock };
export type { DividerBlock };
