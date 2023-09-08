import type { Block } from 'lib/focalboard/block';
import { createBlock } from 'lib/focalboard/block';
import { emptyDocument } from 'lib/prosemirror/constants';
import type { PageContent } from 'lib/prosemirror/interfaces';

type CommentBlock = Block & {
  type: 'comment';
  fields: { content?: PageContent }; // note: the 'text' value is saved as block.title
};

function createCommentBlock(block?: Block): CommentBlock {
  const createdBlock = createBlock(block);
  return {
    ...createdBlock,
    fields: {
      content: emptyDocument,
      ...createdBlock.fields
    },
    type: 'comment'
  };
}

export { createCommentBlock };
export type { CommentBlock };
