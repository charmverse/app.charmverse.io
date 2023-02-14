import type { PostCategory } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { getPostCategoryPath } from 'lib/forums/categories/getPostCategoryPath';
import { createPostComment } from 'lib/forums/comments/createPostComment';
import type { CreatePostCommentInput } from 'lib/forums/comments/interface';

export async function generatePostCategory({
  spaceId,
  name = `Category-${Math.random()}`
}: {
  spaceId: string;
  name?: string;
}): Promise<Required<PostCategory>> {
  return prisma.postCategory.create({
    data: {
      name,
      spaceId,
      path: getPostCategoryPath(name)
    }
  });
}

export async function generatePostWithComment({
  userId,
  spaceId,
  categoryId
}: {
  spaceId: string;
  userId: string;
  categoryId?: string;
}) {
  const commentInput: CreatePostCommentInput = {
    content: {
      type: ''
    },
    contentText: '',
    parentId: v4()
  };

  const post = await generateForumPost({
    spaceId,
    userId,
    categoryId
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
  spaceId,
  path = `post-${v4()}`,
  title = 'Test post'
}: {
  categoryId?: string;
  userId: string;
  spaceId: string;
  path?: string;
  title?: string;
}) {
  if (!categoryId) {
    const category = await generatePostCategory({ spaceId });
    categoryId = category.id;
  }
  return prisma.post.create({
    data: {
      title,
      path,
      contentText: '',
      content: {
        type: 'doc',
        content: []
      },
      space: {
        connect: {
          id: spaceId
        }
      },
      author: {
        connect: {
          id: userId
        }
      },
      category: {
        connect: {
          id: categoryId
        }
      }
    }
  });
}
