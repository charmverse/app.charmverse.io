import { prisma } from 'db';
import { DateTime } from 'luxon';

export async function deleteArchivedPages (maxDay: number) {
  const { count: deletedPagesCount } = await prisma.page.deleteMany({
    where: {
      deletedAt: {
        lte: DateTime.now().minus({
          days: maxDay
        }).toISO()
      }
    }
  });

  const { count: deletedBlocksCount } = await prisma.block.deleteMany({
    where: {
      deletedAt: {
        lte: DateTime.now().minus({
          days: maxDay
        }).toISO()
      }
    }
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
    deletedBlocksCount,
    deletedPagesCount,
    archivedBlocksCount,
    archivedPagesCount
  };
}
