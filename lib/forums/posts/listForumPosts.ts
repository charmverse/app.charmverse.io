import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import type { PaginatedResponse } from 'lib/public-api';
import { isTruthy } from 'lib/utilities/types';

import type { PageWithRelations } from './getPostMeta';
import { getPostMeta } from './getPostMeta';
import type { ForumPostMeta } from './interfaces';

// Maxium posts we want per response
export const defaultPostsPerResult = 5;

export type PaginatedPostList = PaginatedResponse<ForumPostMeta> & { cursor: number };

/**
 * @sort ignored for now - the server sorts posts by most recent
 */
export interface ListForumPostsRequest {
  spaceId: string;
  categoryId?: string;
  page?: number;
  count?: number;
  sort?: string;
}
export async function listForumPosts(
  {
    spaceId,
    page = 0,
    // Count is the number of posts we want per page
    count = defaultPostsPerResult,
    categoryId
  }: ListForumPostsRequest,
  userId: string
): Promise<PaginatedPostList> {
  // Fix string input values
  page = typeof page === 'string' ? parseInt(page) : page;
  count = typeof count === 'string' ? parseInt(count) : count;
  // Avoid page being less than 0
  page = Math.abs(page);
  const toSkip = Math.max(page, page - 1) * count;

  const orderQuery: Prisma.PageFindManyArgs = {
    // Return posts ordered from most recent to oldest
    orderBy: {
      createdAt: 'desc'
    }
  };

  const postPropsQuery: Prisma.PostWhereInput = categoryId
    ? {
        categoryId
      }
    : {};

  const pages = await prisma.page.findMany({
    ...orderQuery,
    take: count,
    skip: toSkip,
    where: {
      type: 'post',
      spaceId,
      post: postPropsQuery,
      deletedAt: null
    },
    include: {
      upDownVotes: {
        select: {
          upvoted: true,
          createdBy: true
        }
      },
      post: true
    }
  });

  const hasNext =
    pages.length === 0
      ? false
      : (
          await prisma.page.findMany({
            ...orderQuery,
            skip: toSkip + count,
            take: 1,
            where: { type: 'post', spaceId, post: postPropsQuery }
          })
        ).length === 1;

  const data = pages
    .map((_page) => {
      if (_page.post) {
        return getPostMeta({ page: _page as PageWithRelations, userId });
      }
      return null;
    })
    .filter(isTruthy);

  const response: PaginatedPostList = {
    data,
    hasNext,
    cursor: hasNext ? page + 1 : 0
  };

  return response;
}
