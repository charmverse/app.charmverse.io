import type { PostStatus } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { createPostComment } from 'lib/forums/comments/createPostComment';
import type { CreatePostCommentInput } from 'lib/forums/comments/interface';
import { createPage } from 'testing/setupDatabase';

export async function generatePostComment({ userId, spaceId }: { spaceId: string; userId: string }) {
  const commentInput: CreatePostCommentInput = {
    content: {
      type: ''
    },
    contentText: '',
    parentId: v4()
  };

  const page = await createPage({
    createdBy: userId,
    spaceId
  });

  const post = await generateForumPost({
    pageId: page.id
  });

  const postComment = await createPostComment({
    ...commentInput,
    postId: post.id,
    userId
  });

  return {
    comment: postComment,
    post,
    page
  };
}

export async function generateForumPost({
  status = 'draft',
  pageId,
  categoryId = null
}: {
  status?: PostStatus;
  pageId: string;
  categoryId?: null | string;
}) {
  return prisma.post.create({
    data: {
      id: pageId,
      status,
      categoryId,
      page: {
        connect: {
          id: pageId
        }
      }
    }
  });
}
