import { prisma } from '@charmverse/core/prisma-client';
import _sum from 'lodash/sum';

import type { BlocksCountQuery, GenericBlocksCount } from './interfaces';

export type DetailedCommentBlocksCount = {
  pageComments: number;
  comment: number;
  blockComment: number;
  postComment: number;
  applicationComment: number;
};
export type CommentBlocksCount = GenericBlocksCount<DetailedCommentBlocksCount>;
export async function countCommentBlocks({ spaceId }: BlocksCountQuery): Promise<CommentBlocksCount> {
  const counts: CommentBlocksCount = {
    total: 0,
    details: {
      applicationComment: 0,
      blockComment: 0,
      comment: 0,
      pageComments: 0,
      postComment: 0
    }
  };

  counts.details.applicationComment = await prisma.applicationComment.count({
    where: {
      application: {
        spaceId
      }
    }
  });

  counts.details.blockComment = await prisma.block.count({
    where: {
      spaceId,
      type: 'comment'
    }
  });

  counts.details.comment = await prisma.comment.count({
    where: {
      spaceId
    }
  });

  counts.details.pageComments = await prisma.pageComment.count({
    where: {
      page: {
        spaceId
      }
    }
  });

  counts.details.postComment = await prisma.postComment.count({
    where: {
      post: {
        spaceId
      }
    }
  });

  counts.total = _sum(Object.values(counts.details));

  return counts;
}
