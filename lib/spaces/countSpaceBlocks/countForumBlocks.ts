import type { Post } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { countBlocks } from 'lib/prosemirror/countBlocks';
import { defaultPaginatedPrismaTaskBatchSize, paginatedPrismaTask } from 'lib/utilities/paginatedPrismaTask';

import type { BlocksCountQuery, GenericBlocksCount } from './interfaces';

export type DetailedForumBlocksCount = {
  categories: number;
  posts: number;
  postContentBlocks: number;
};

// Used internally in the function
type CountSubset = Pick<DetailedForumBlocksCount, 'posts' | 'postContentBlocks'>;

export type ForumBlocksCount = GenericBlocksCount<DetailedForumBlocksCount>;
export async function countForumBlocks({
  spaceId,
  batchSize = defaultPaginatedPrismaTaskBatchSize
}: BlocksCountQuery): Promise<ForumBlocksCount> {
  const counts: ForumBlocksCount = {
    total: 0,
    details: {
      categories: 0,
      posts: 0,
      postContentBlocks: 0
    }
  };

  counts.details.categories = await prisma.postCategory.count({
    where: {
      spaceId
    }
  });

  const postsAndContentCount = await paginatedPrismaTask({
    model: 'post',
    batchSize,
    queryOptions: {
      where: {
        spaceId,
        deletedAt: null
      },
      select: {
        id: true,
        content: true
      }
    },
    callback: (posts: Pick<Post, 'content' | 'id'>[]) => {
      return posts.reduce(
        (acc, post) => {
          acc.posts += 1;
          acc.postContentBlocks += countBlocks(post.content, { blockId: post.id, spaceId });
          return acc;
        },
        { posts: 0, postContentBlocks: 0 } as CountSubset
      );
    },
    reducer: (countsList: CountSubset[]) => {
      return countsList.reduce(
        (acc, curr) => {
          acc.posts += curr.posts;
          acc.postContentBlocks += curr.postContentBlocks;
          return acc;
        },
        { posts: 0, postContentBlocks: 0 } as CountSubset
      );
    }
  });

  counts.details = {
    ...counts.details,
    ...postsAndContentCount
  };

  return counts;
}
