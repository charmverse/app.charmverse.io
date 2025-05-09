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
        spaceId,
        bounty: {
          page: {
            deletedAt: null
          }
        }
      },
      deletedAt: null
    }
  });

  const deletedBlocks = await prisma.block.findMany({
    where: {
      spaceId,
      deletedAt: {
        not: null
      }
    },
    select: {
      id: true
    }
  });

  counts.details.blockComment = await prisma.block.count({
    where: {
      spaceId,
      type: 'comment',
      deletedAt: null,
      parentId: {
        notIn: deletedBlocks.map((b) => b.id)
      },
      rootId: {
        notIn: deletedBlocks.map((b) => b.id)
      }
    }
  });

  counts.details.comment = await prisma.comment.count({
    where: {
      spaceId,
      page: {
        deletedAt: null
      }
    }
  });

  counts.details.pageComments = await prisma.pageComment.count({
    where: {
      page: {
        spaceId,
        deletedAt: null
      },
      deletedAt: null
    }
  });

  counts.details.postComment = await prisma.postComment.count({
    where: {
      post: {
        spaceId,
        deletedAt: null
      },
      deletedAt: null
    }
  });

  counts.total = _sum(Object.values(counts.details));

  return counts;
}
