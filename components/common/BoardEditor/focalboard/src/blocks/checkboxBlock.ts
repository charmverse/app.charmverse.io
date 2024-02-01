import type { Block } from 'lib/focalboard/block';
import { createBlock } from 'lib/focalboard/block';

import type { ContentBlock } from './contentBlock';

type CheckboxBlock = ContentBlock & {
  type: 'checkbox';
};

function createCheckboxBlock(block?: Block): CheckboxBlock {
  return {
    ...createBlock(block),
    type: 'checkbox'
  };
}

export { createCheckboxBlock };
export type { CheckboxBlock };
