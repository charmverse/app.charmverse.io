import type { PageContent } from 'models';

import type { Block } from './block';
import { createBlock } from './block';

type CommentBlock = Block & {
  type: 'comment';
  fields: { content?: PageContent }; // note: the 'text' value is saved as block.title
}

function createCommentBlock (block?: Block): CommentBlock {
  return {
    ...createBlock(block),
    type: 'comment'
  };
}

export { createCommentBlock };
export type { CommentBlock };
