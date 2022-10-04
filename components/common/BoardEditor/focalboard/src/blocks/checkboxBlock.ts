import type { ContentBlock } from './contentBlock';
import type { Block } from './block';
import { createBlock } from './block';

type CheckboxBlock = ContentBlock & {
    type: 'checkbox';
}

function createCheckboxBlock (block?: Block): CheckboxBlock {
  return {
    ...createBlock(block),
    type: 'checkbox'
  };
}

export { createCheckboxBlock };
export type { CheckboxBlock };
