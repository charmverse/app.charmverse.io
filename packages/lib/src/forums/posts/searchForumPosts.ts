import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { defaultPostsPerResult } from './constants';
import type { PostWithRelations } from './getPostMeta';
import { getPostMeta } from './getPostMeta';
import type { PaginatedPostList } from './listForumPosts';

export interface SearchForumPostsRequest {
  spaceId: string;
  search?: string;
  page?: number;
  count?: number;
  categoryId?: string | string[];
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

  const orderQuery: Prisma.PostFindManyArgs = {
    // Return posts ordered from most recent to oldest
    orderBy: {
      createdAt: 'desc'
    }
  };

  const whereQuery: Prisma.PostWhereInput = {
    categoryId: categoryId instanceof Array ? { in: categoryId } : categoryId,
    spaceId,
    deletedAt: null,
    isDraft: false,
    OR: search
      ? [
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
      : undefined
  };

  const posts = await prisma.post.findMany({
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
      }
    }
  });

  let hasNext = false;
  if (posts.length > 0) {
    const nextPosts = await prisma.post.findMany({
      ...orderQuery,
      skip: toSkip + count,
      take: 1,
      where: whereQuery
    });
    if (nextPosts.length > 0) {
      hasNext = true;
    }
  }

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
