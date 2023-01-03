import type { Page, Post, Prisma } from '@prisma/client';
import { findChildren } from 'prosemirror-utils';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { getPagePath } from 'lib/pages/utils';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import { InsecureOperationError } from 'lib/utilities/errors';

import { selectPageValues } from './getForumPost';
import type { ForumPostPage } from './interfaces';

export type CreateForumPostInput = Pick<Page, 'createdBy' | 'spaceId' | 'content' | 'contentText' | 'title'> &
  Pick<Post, 'categoryId'>;

export async function createForumPost({
  content,
  contentText,
  createdBy,
  spaceId,
  title,
  categoryId
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
      content: (content ?? undefined) as Prisma.InputJsonObject,
      contentText,
      updatedBy: createdBy,
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
          spaceId,
          categoryId
        }
      }
    },
    include: {
      post: true
    }
  });

  return {
    ...selectPageValues(createdPost),
    post: createdPost.post!
  };
}

export async function trackCreateForumPostEvent({ page, userId }: { page: ForumPostPage; userId: string }) {
  const category = await prisma.postCategory.findUnique({
    where: {
      id: page.post.categoryId
    },
    select: {
      name: true
    }
  });

  if (category) {
    trackUserAction('create_a_post', {
      categoryName: category.name,
      resourceId: page.id,
      spaceId: page.spaceId,
      userId,
      hasImage: page.content
        ? findChildren(getNodeFromJson(page.content), (node) => node.type.name === 'image', true)?.length !== 0
        : false
    });
  }
}
