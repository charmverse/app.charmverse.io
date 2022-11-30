import type { Page, Post, PostCategory, Prisma } from '@prisma/client';

import { prisma } from 'db';
import { InsecureOperationError } from 'lib/utilities/errors';

import { getForumPost } from './getForumPost';
import type { ForumPostPage } from './interfaces';

export type UpdateForumPostInput = Pick<Page, 'content' | 'contentText' | 'title'> & {
  categoryId?: Post['categoryId'] | null;
};

export async function updateForumPost(
  postId: string,
  { content, contentText, categoryId, title }: UpdateForumPostInput
): Promise<ForumPostPage> {
  if (categoryId) {
    const [page, category] = await Promise.all([
      prisma.page.findUnique({
        where: {
          postId
        },
        select: {
          spaceId: true
        }
      }),
      prisma.postCategory.findUnique({
        where: {
          id: categoryId
        },
        select: {
          spaceId: true
        }
      })
    ]);

    if (page?.spaceId !== category?.spaceId) {
      throw new InsecureOperationError('Cannot update post with a category from another space');
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.page.update({
      where: { id: postId },
      data: {
        content: content as Prisma.InputJsonObject,
        contentText,
        title
      }
    });

    if (categoryId) {
      await tx.post.update({ where: { id: postId }, data: { category: { connect: { id: categoryId } } } });
    } else if (categoryId === null) {
      await tx.post.update({ where: { id: postId }, data: { category: { disconnect: true } } });
    }
  });
  return getForumPost(postId) as Promise<ForumPostPage>;
}
