import type { Post, Prisma } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { InsecureOperationError } from 'lib/utilities/errors';

import { getPostPath } from './getPostPath';

export type CreateForumPostInput = Pick<
  Post,
  'createdBy' | 'spaceId' | 'content' | 'contentText' | 'title' | 'categoryId'
>;

export async function createForumPost({
  content,
  contentText,
  createdBy,
  spaceId,
  title,
  categoryId
}: CreateForumPostInput): Promise<Post> {
  if (categoryId) {
    const category = await prisma.postCategory.findUnique({
      where: {
        id: categoryId
      },
      select: {
        spaceId: true
      }
    });

    if (spaceId !== category?.spaceId) {
      throw new InsecureOperationError('Cannot update post with a category from another space');
    }
  }

  const postId = v4();

  const createdPost = await prisma.post.create({
    data: {
      id: postId,
      title,
      content: (content ?? undefined) as Prisma.InputJsonObject,
      contentText,
      category: {
        connect: {
          id: categoryId
        }
      },
      author: {
        connect: {
          id: createdBy
        }
      },
      space: {
        connect: {
          id: spaceId
        }
      },
      path: getPostPath(title)
    }
  });

  return createdPost;
}
