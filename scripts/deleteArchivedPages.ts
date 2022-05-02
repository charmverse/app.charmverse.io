import { prisma } from 'db';
import log from 'lib/log';
import cron from 'node-cron';
import { DateTime } from 'luxon';

const MAX_ARCHIVE_PAGE_DAYS = 30;

// Filter all pages that are at least a month old
function filterByDays (date: Date, geq: number) {
  return DateTime.now().diff(DateTime.fromMillis(new Date(date).getTime()), 'days').toObject().days as number >= geq;
}

export async function main () {
  log.debug('[cron]: Starting delete-archived-pages cron job');
  // Cron job that runs every hour
  cron.schedule('0 * * * *', async () => {
    const pages = await prisma.page.findMany({
      where: {
        deletedAt: {
          not: null
        }
      },
      select: {
        id: true,
        deletedAt: true
      }
    });

    const pagesToBeDeleted = pages.filter(({ deletedAt }) => deletedAt && filterByDays(deletedAt, MAX_ARCHIVE_PAGE_DAYS));

    const blocks = await prisma.page.findMany({
      where: {
        deletedAt: {
          not: null
        }
      },
      select: {
        id: true,
        deletedAt: true
      }
    });

    const blocksToBeDeleted = blocks.filter(({ deletedAt }) => deletedAt && filterByDays(deletedAt, MAX_ARCHIVE_PAGE_DAYS));

    await prisma.page.deleteMany({
      where: {
        id: {
          in: pagesToBeDeleted.map(({ id }) => id)
        }
      }
    });

    await prisma.block.deleteMany({
      where: {
        id: {
          in: blocksToBeDeleted.map(({ id }) => id)
        }
      }
    });

    // log.debug(`[cron]: Deleted ${pagesToBeDeleted.length} pages, ${blocksToBeDeleted.length} blocks`);
  });
}

main();
