import type { CreatePostCommentInput } from '@root/lib/forums/comments/interface';
import { createPageComment } from '@root/lib/pages/comments/createPageComment';
import { v4 } from 'uuid';

import { createPage } from '../setupDatabase';

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
