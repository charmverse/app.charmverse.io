import type { Page, Post, Prisma } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { getPagePath } from 'lib/pages/utils';
import { InsecureOperationError } from 'lib/utilities/errors';

import type { ForumPostPage } from './interfaces';

export type CreateForumPostInput = Pick<Page, 'createdBy' | 'spaceId' | 'content' | 'contentText' | 'title'> &
  Partial<Pick<Post, 'categoryId'> & Pick<Page, 'galleryImage' | 'headerImage'>>;

export async function createForumPost({
  content,
  contentText,
  createdBy,
  spaceId,
  title,
  categoryId,
  galleryImage,
  headerImage
}: CreateForumPostInput): Promise<ForumPostPage> {
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

  const createdPost = await prisma.page.create({
    data: {
      id: postId,
      title,
      content: content as Prisma.InputJsonObject,
      contentText,
      updatedBy: createdBy,
      galleryImage,
      headerImage,
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
      type: 'post',
      path: getPagePath(),
      post: {
        create: {
          id: postId,
          status: 'draft',
          category: !categoryId
            ? undefined
            : {
                connect: {
                  id: categoryId
                }
              }
        }
      }
    },
    include: {
      post: true
    }
  });

  return createdPost as ForumPostPage;
}
