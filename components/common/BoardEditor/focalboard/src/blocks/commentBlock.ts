import type { Block } from 'lib/focalboard/block';
import { createBlock } from 'lib/focalboard/block';
import type { PageContent } from 'lib/prosemirror/interfaces';

type CommentBlock = Block & {
  type: 'comment';
  fields: { content?: PageContent }; // note: the 'text' value is saved as block.title
};

function createCommentBlock(block?: Block): CommentBlock {
  return {
    ...createBlock(block),
    type: 'comment'
  };
}

export { createCommentBlock };
export type { CommentBlock };
