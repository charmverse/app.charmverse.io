import { v4 } from 'uuid';

import { prisma } from 'db';
import { createPostComment } from 'lib/forums/comments/createPostComment';
import type { CreatePostCommentInput } from 'lib/forums/comments/interface';
import { createForumPost } from 'lib/forums/posts/createForumPost';

export async function generatePostCategory({
  spaceId,
  name = `Category-${Math.random()}`
}: {
  spaceId: string;
  name?: string;
}) {
  return prisma.postCategory.create({
    data: {
      name,
      spaceId
    }
  });
}

export async function generatePostWithComment({ userId, spaceId }: { spaceId: string; userId: string }) {
  const commentInput: CreatePostCommentInput = {
    content: {
      type: ''
    },
    contentText: '',
    parentId: v4()
  };

  const post = await generateForumPost({
    spaceId,
    userId
  });

  const postComment = await createPostComment({
    ...commentInput,
    postId: post.id,
    userId
  });

  return {
    comment: postComment,
    post
  };
}

export async function generateForumPost({
  categoryId,
  userId,
  spaceId
}: {
  categoryId?: string;
  userId: string;
  spaceId: string;
}) {
  if (!categoryId) {
    const category = await generatePostCategory({ spaceId });
    categoryId = category.id;
  }
  return createForumPost({
    categoryId,
    content: {
      type: ''
    },
    contentText: '',
    createdBy: userId,
    spaceId,
    title: 'Title'
  });
}
