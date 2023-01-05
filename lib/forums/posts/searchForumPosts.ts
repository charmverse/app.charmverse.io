import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import { isTruthy } from 'lib/utilities/types';

import { defaultPostsPerResult } from './constants';
import type { PageWithRelations } from './getPostMeta';
import { getPostMeta } from './getPostMeta';
import type { PaginatedPostList } from './listForumPosts';

export interface SearchForumPostsRequest {
  spaceId: string;
  search?: string;
  page?: number;
  count?: number;
  categoryId?: string;
}
export async function searchForumPosts(
  {
    spaceId,
    search,
    page = 0,
    // Count is the number of posts we want per page
    count = defaultPostsPerResult,
    categoryId
  }: SearchForumPostsRequest,
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

  const whereQuery: Prisma.PageWhereInput = {
    type: 'post',
    post: {
      categoryId
    },
    spaceId,
    deletedAt: null,
    OR: [
      {
        title: {
          contains: search,
          mode: 'insensitive'
        }
      },
      {
        contentText: {
          contains: search,
          mode: 'insensitive'
        }
      }
    ]
  };

  const pages = await prisma.page.findMany({
    ...orderQuery,
    take: count,
    skip: toSkip,
    where: whereQuery,
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

  let hasNext = false;
  if (pages.length > 0) {
    const nextPages = await prisma.page.findMany({
      ...orderQuery,
      skip: toSkip + count,
      take: 1,
      where: whereQuery
    });
    if (nextPages.length > 0) {
      hasNext = true;
    }
  }

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
