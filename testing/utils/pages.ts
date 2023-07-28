import { v4 } from 'uuid';

import type { CreatePostCommentInput } from 'lib/forums/comments/interface';
import { createPageComment } from 'lib/pages/comments/createPageComment';
import { createPage } from 'testing/setupDatabase';

type CommentInput = {
  content: any;
  contentText: string;
  parentId?: string;
};

export async function generatePageWithComment(
  {
    userId,
    spaceId
  }: {
    spaceId: string;
    userId: string;
  },
  commentInputData?: CommentInput
) {
  const commentInput: CreatePostCommentInput = commentInputData ?? {
    content: {
      type: ''
    },
    contentText: '',
    parentId: v4()
  };

  const page = await createPage({
    spaceId,
    createdBy: userId
  });

  const postComment = await createPageComment({
    ...commentInput,
    pageId: page.id,
    userId
  });

  return {
    comment: postComment,
    page
  };
}
