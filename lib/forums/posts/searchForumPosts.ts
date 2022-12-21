import type { Prisma } from '@prisma/client';

import { prisma } from 'db';

import type { ForumPostPage } from './interfaces';
import type { PaginatedPostList } from './listForumPosts';
// Maxium posts we want per response
export const defaultPostsPerResult = 5;
/**
 * @sort ignored for now - the server sorts posts by most recent
 */
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
