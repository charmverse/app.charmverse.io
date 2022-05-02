import { prisma } from 'db';
import log from 'lib/log';
import cron from 'node-cron';
import { DateTime } from 'luxon';

const MAX_ARCHIVE_PAGE_DAYS = 30;

export async function main () {
  log.debug('[cron]: Starting delete-archived-pages cron job');
  // Cron job that runs every hour
  cron.schedule('*/30 * * * * *', async () => {
    const { count: deletedPagesCount } = await prisma.page.deleteMany({
      where: {
        deletedAt: {
          lte: DateTime.now().minus({
            days: MAX_ARCHIVE_PAGE_DAYS
          }).toISO()
        }
      }
    });

    const { count: deletedBlocksCount } = await prisma.block.deleteMany({
      where: {
        deletedAt: {
          lte: DateTime.now().minus({
            days: MAX_ARCHIVE_PAGE_DAYS
          }).toISO()
        }
      }
    });

    log.debug(`[cron]: Deleted ${deletedPagesCount} pages, ${deletedBlocksCount} blocks`);
  });
}

main();
