import type { Post, Prisma } from '@prisma/client';

import { prisma } from 'db';
import { InsecureOperationError, UndesirableOperationError } from 'lib/utilities/errors';

import { PostNotFoundError } from './errors';

export type UpdateForumPostInput = Partial<Pick<Post, 'content' | 'contentText' | 'title' | 'categoryId'>>;

export async function updateForumPost(
  postId: string,
  { content, contentText, categoryId, title }: UpdateForumPostInput
): Promise<Post> {
  const post = await prisma.post.findUnique({
    where: {
      id: postId
    },
    select: {
      spaceId: true,
      locked: true
    }
  });

  if (!post) {
    throw new PostNotFoundError(postId);
  }

  if (categoryId) {
    const category = await prisma.postCategory.findUnique({
      where: {
        id: categoryId
      },
      select: {
        spaceId: true
      }
    });

    if (post?.spaceId !== category?.spaceId) {
      throw new InsecureOperationError('Cannot update post with a category from another space');
    }
  }

  if (post.locked) {
    throw new UndesirableOperationError('Cannot update a locked post');
  }

  await prisma.post.update({
    where: {
      id: postId
    },
    data: {
      title,
      content: content as Prisma.InputJsonObject,
      contentText,
      category: !categoryId
        ? undefined
        : {
            connect: {
              id: categoryId
            }
          }
    }
  });
  return prisma.post.findUnique({
    where: {
      id: postId
    }
  }) as Promise<Post>;
}
