import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

export async function deleteArchivedPages(maxDay: number) {
  const whereQuery = {
    deletedAt: {
      lte: DateTime.now()
        .minus({
          days: maxDay
        })
        .toISO()
    }
  } as const;

  const { count: deletedBountiesCount } = await prisma.bounty.deleteMany({
    where: {
      page: whereQuery
    }
  });

  const { count: deletedPostsCount } = await prisma.post.deleteMany({
    where: whereQuery
  });

  const { count: deletedProposalsCount } = await prisma.proposal.deleteMany({
    where: {
      page: whereQuery
    }
  });

  const { count: deletedPagesCount } = await prisma.page.deleteMany({
    where: whereQuery
  });

  const { count: deletedBlocksCount } = await prisma.block.deleteMany({
    where: whereQuery
  });

  const archivedPagesCount = await prisma.page.count({
    where: {
      deletedAt: {
        not: null
      }
    }
  });

  const archivedBlocksCount = await prisma.block.count({
    where: {
      deletedAt: {
        not: null
      }
    }
  });

  return {
    deletedProposalsCount,
    deletedBlocksCount,
    deletedPagesCount,
    archivedBlocksCount,
    archivedPagesCount,
    deletedBountiesCount,
    deletedPostsCount
  };
}
