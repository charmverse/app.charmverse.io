import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import type { PaginatedResponse } from 'lib/public-api';
import { InvalidInputError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';

import { defaultPostsPerResult, postSortOptions } from './constants';
import type { PageWithRelations } from './getPostMeta';
import { getPostMeta } from './getPostMeta';
import type { ForumPostMeta } from './interfaces';

export type PaginatedPostList = PaginatedResponse<ForumPostMeta & { totalComments: number }> & { cursor: number };

export type PostOrder = typeof postSortOptions[number];

export interface ListForumPostsRequest {
  spaceId: string;
  categoryId?: string;
  page?: number;
  count?: number;
  sort?: PostOrder;
}

export async function listForumPosts(
  {
    spaceId,
    page = 0,
    // Count is the number of posts we want per page
    count = defaultPostsPerResult,
    categoryId,
    sort
  }: ListForumPostsRequest,
  userId: string
): Promise<PaginatedPostList> {
  // Fix string input values
  page = typeof page === 'string' ? parseInt(page) : page;
  count = typeof count === 'string' ? parseInt(count) : count;
  // Avoid page being less than 0
  page = Math.abs(page);
  const toSkip = Math.max(page, page - 1) * count;

  const orderByNewest: Prisma.PageOrderByWithRelationAndSearchRelevanceInput = {
    createdAt: 'desc'
  };

  const orderByMostCommmented: Prisma.PageOrderByWithRelationAndSearchRelevanceInput = {
    comments: {
      _count: 'desc'
    }
  };

  const orderByMostVoted: Prisma.PageOrderByWithRelationAndSearchRelevanceInput = {
    upDownVotes: {
      _count: 'desc'
    }
  };

  if (sort && !postSortOptions.includes(sort)) {
    throw new InvalidInputError(`This type of sort does not exist.`);
  }

  const orderQuery: Prisma.PageFindManyArgs = {
    // Return posts ordered from most recent to oldest
    orderBy: {
      ...((sort === 'newest' || !sort || !postSortOptions.includes(sort)) && orderByNewest),
      ...(sort === 'most_commented' && orderByMostCommmented),
      ...(sort === 'most_voted' && orderByMostVoted)
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

  const comments = await prisma.pageComment.groupBy({
    _count: {
      _all: true
    },
    by: ['pageId'],
    where: {
      pageId: {
        in: pages.map((_page) => _page.id)
      }
    }
  });

  const data = pages
    .map((_page) => {
      if (_page.post) {
        const comment = comments.find((_comment) => _comment.pageId === _page.id);
        const postMeta = getPostMeta({ page: _page as PageWithRelations, userId });
        return {
          ...postMeta,
          totalComments: comment?._count._all ?? 0
        };
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
