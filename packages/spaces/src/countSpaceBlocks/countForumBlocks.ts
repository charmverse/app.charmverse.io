import type { Post } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { defaultPaginatedPrismaTaskBatchSize, paginatedPrismaTask } from '@packages/lib/utils/paginatedPrismaTask';
import _sum from 'lodash/sum';

import { countBlocks } from 'lib/prosemirror/countBlocks';

import type { BlocksCountQuery, GenericBlocksCount } from './interfaces';

export type DetailedForumBlocksCount = {
  categories: number;
  posts: number;
  postContentBlocks: number;
};

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
    mapper: (post: Pick<Post, 'content' | 'id'>) => {
      return countBlocks(post.content, { blockId: post.id, spaceId });
    },
    onSuccess: (countsList: number[]) => ({
      posts: countsList.length,
      postContentBlocks: _sum(countsList)
    })
  });

  counts.details = {
    ...counts.details,
    ...postsAndContentCount
  };

  counts.total = _sum(Object.values(counts.details));

  return counts;
}
