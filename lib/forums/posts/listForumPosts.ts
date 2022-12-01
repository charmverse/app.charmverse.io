import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import type { PaginatedResponse } from 'lib/public-api';

import type { ForumPostPage } from './interfaces';

// Maxium posts we want per response
export const defaultPostsPerResult = 5;

export type PaginatedPostList<T = Record<string, unknown>> = Required<
  PaginatedResponse<ForumPostPage> & { cursor: number }
> &
  T;

export type CategoryIdQuery = string | string[] | null | undefined;
/**
 * @sort ignored for now - the server sorts posts by most recent
 */
export interface ListForumPostsRequest {
  spaceId: string;
  categoryIds?: CategoryIdQuery;
  page?: number;
  count?: number;
  sort?: string;
}

export async function listForumPosts({
  spaceId,
  page = 0,
  sort,
  // Count is the number of posts we want per page
  count = defaultPostsPerResult,
  categoryIds
}: ListForumPostsRequest): Promise<PaginatedPostList> {
  // Fix string input values
  page = typeof page === 'string' ? parseInt(page) : page;
  count = typeof count === 'string' ? parseInt(count) : count;

  if (typeof categoryIds === 'string') {
    categoryIds = [categoryIds];
  }

  // Avoid page being less than 0
  page = Math.abs(page);
  const toSkip = Math.max(page, page - 1) * count;

  const orderQuery: Prisma.PageFindManyArgs = {
    // Return posts ordered from most recent to oldest
    orderBy: {
      createdAt: 'desc'
    }
  };

  const postPropsQuery: Prisma.PageWhereInput = {
    post: categoryIds
      ? {
          categoryId: {
            in: categoryIds
          }
        }
      : categoryIds === null
      ? { categoryId: null }
      : undefined
  };

  const posts = (await prisma.page.findMany({
    ...orderQuery,
    take: count,
    skip: toSkip,
    where: {
      type: 'post',
      spaceId,
      ...postPropsQuery
    },
    include: {
      post: true
    }
  })) as ForumPostPage[];

  const hasNext =
    posts.length === 0
      ? false
      : (
          await prisma.page.findMany({
            ...orderQuery,
            skip: toSkip + count,
            take: 1,
            where: { type: 'post', spaceId, ...postPropsQuery }
          })
        ).length === 1;

  const response: PaginatedPostList = {
    data: posts,
    hasNext,
    cursor: hasNext ? page + 1 : 0
  };

  return response;
}
