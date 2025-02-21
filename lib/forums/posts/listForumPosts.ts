import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/utils/errors';
import type { PaginatedResponse } from '@root/lib/public-api';

import type { PostSortOption } from './constants';
import { defaultPostsPerResult, postSortOptions } from './constants';
import { getPostMeta } from './getPostMeta';
import type { PostWithRelations, ForumPostMeta } from './getPostMeta';

export type PaginatedPostList = PaginatedResponse<ForumPostMeta & { totalComments: number }> & { cursor: number };

export interface ListForumPostsRequest {
  spaceId: string;
  categoryId?: string | string[];
  page?: number;
  count?: number;
  sort?: PostSortOption;
}

export async function listForumPosts(
  {
    spaceId,
    page = 0,
    // Count is the number of posts we want per page
    count = defaultPostsPerResult,
    categoryId,
    sort,
    authorSelect
  }: ListForumPostsRequest & {
    authorSelect?: Prisma.UserSelect;
  },
  userId?: string
): Promise<PaginatedPostList> {
  // Replicates prisma behaviour, but avoids a database call
  if (categoryId instanceof Array && categoryId.length === 0) {
    return {
      data: [],
      cursor: 0,
      hasNext: false
    };
  }

  // Fix string input values
  page = typeof page === 'string' ? parseInt(page) : page;
  count = typeof count === 'string' ? parseInt(count) : count;
  // Avoid page being less than 0
  page = Math.abs(page);
  const toSkip = Math.max(page, page - 1) * count;

  const orderByNewest: Prisma.PostOrderByWithRelationAndSearchRelevanceInput = {
    createdAt: 'desc'
  };

  const orderByMostCommented: Prisma.PostOrderByWithRelationAndSearchRelevanceInput = {
    comments: {
      _count: 'desc'
    }
  };

  const orderByMostVoted: Prisma.PostOrderByWithRelationAndSearchRelevanceInput = {
    upDownVotes: {
      _count: 'desc'
    }
  };

  if (sort && !postSortOptions.includes(sort)) {
    throw new InvalidInputError(`This type of sort does not exist.`);
  }

  const orderQuery: Prisma.PostFindManyArgs = {
    // Return posts ordered from most recent to oldest
    orderBy: {
      ...((sort === 'new' || !sort || !postSortOptions.includes(sort)) && orderByNewest),
      ...(sort === 'hot' && orderByMostCommented),
      ...(sort === 'top' && orderByMostVoted)
    }
  };

  const postPropsQuery: Prisma.PostWhereInput = {
    categoryId: categoryId instanceof Array ? { in: categoryId } : categoryId,
    isDraft: false
  };

  const posts = await prisma.post.findMany({
    ...orderQuery,
    take: count,
    skip: toSkip,
    where: {
      ...postPropsQuery,
      spaceId,
      deletedAt: null
    },
    include: {
      upDownVotes: {
        select: {
          upvoted: true,
          createdBy: true
        }
      },
      author: authorSelect
        ? {
            select: authorSelect
          }
        : undefined
    }
  });

  const hasNext =
    posts.length === 0
      ? false
      : (
          await prisma.post.findMany({
            ...orderQuery,
            skip: toSkip + count,
            take: 1,
            where: {
              ...postPropsQuery,
              spaceId
            }
          })
        ).length === 1;

  const comments = await prisma.postComment.groupBy({
    _count: {
      _all: true
    },
    by: ['postId'],
    where: {
      postId: {
        in: posts.map((_post) => _post.id)
      }
    }
  });

  const data = posts.map((_post) => {
    const comment = comments.find((_comment) => _comment.postId === _post.id);
    const postMeta = getPostMeta({ post: _post as PostWithRelations, userId });
    return {
      ...postMeta,
      totalComments: comment?._count._all ?? 0
    };
  });

  const response: PaginatedPostList = {
    data,
    hasNext,
    cursor: hasNext ? page + 1 : 0
  };

  return response;
}
