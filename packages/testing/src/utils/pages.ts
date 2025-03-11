import { prisma } from '@charmverse/core/prisma-client';
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
  const commentInput = commentInputData ?? {
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

  const postComment = await prisma.pageComment.create({
    data: {
      ...commentInput,
      user: {
        connect: {
          id: userId
        }
      },
      page: {
        connect: {
          id: page.id
        }
      }
    }
  });

  return {
    comment: postComment,
    page
  };
}
