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
export async function listForumPosts(
  {
    spaceId,
    page = 0,
    // Count is the number of posts we want per page
    count = defaultPostsPerResult,
    categoryIds
  }: ListForumPostsRequest,
  userId: string
): Promise<PaginatedPostList> {
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

  const pages = await prisma.page.findMany({
    ...orderQuery,
    take: count,
    skip: toSkip,
    where: {
      type: 'post',
      spaceId,
      ...postPropsQuery
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
            where: { type: 'post', spaceId, ...postPropsQuery }
          })
        ).length === 1;

  const response: PaginatedPostList = {
    data: pages.map((_page) => {
      const { upDownVotes, post, ...rest } = _page;
      const userVote = upDownVotes.find((vote) => vote.createdBy === userId);
      const forumPostPage: ForumPostPage = {
        ...rest,
        post: {
          ...post!,
          downvotes: upDownVotes.filter((vote) => !vote.upvoted).length,
          upvotes: upDownVotes.filter((vote) => vote.upvoted).length,
          upvoted: userVote ? userVote.upvoted : undefined
        }
      };
      return forumPostPage;
    }),
    hasNext,
    cursor: hasNext ? page + 1 : 0
  };

  return response;
}
