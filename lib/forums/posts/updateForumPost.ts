import type { Page, Post, Prisma } from '@prisma/client';

import { prisma } from 'db';
import { DataNotFoundError, InsecureOperationError, UndesirableOperationError } from 'lib/utilities/errors';

import { getForumPost } from './getForumPost';
import type { ForumPostPage } from './interfaces';

export type UpdateForumPostInput = Partial<
  Pick<Page, 'content' | 'contentText' | 'title' | 'galleryImage' | 'headerImage'> & {
    categoryId?: Post['categoryId'] | null;
  }
>;

export async function updateForumPost(
  postId: string,
  { content, contentText, categoryId, title, galleryImage, headerImage }: UpdateForumPostInput
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

  const post = await prisma.post.findUnique({
    where: {
      id: postId
    }
  });

  if (!post) {
    throw new DataNotFoundError(`Post with id ${postId} not found`);
  } else if (post.locked) {
    throw new UndesirableOperationError('Cannot update a locked post');
  }

  await prisma.$transaction(async (tx) => {
    await tx.page.update({
      where: { id: postId },
      data: {
        content: content as Prisma.InputJsonObject,
        contentText,
        title,
        galleryImage,
        headerImage
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
