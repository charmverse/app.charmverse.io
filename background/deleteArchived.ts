import log from 'lib/log';
import cron from 'node-cron';
import { deleteArchivedPages } from '../lib/pages/server/deleteArchivedPages';

const MAX_ARCHIVE_DAYS = process.env.MAX_ARCHIVE_DAYS ? parseInt(process.env.MAX_ARCHIVE_DAYS) : 30;

export async function main () {
  log.debug('[cron]: Starting delete-archived-pages cron job');
  // Cron job that runs every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const { deletedPagesCount, deletedBlocksCount } = await deleteArchivedPages(MAX_ARCHIVE_DAYS);
      log.info(`[cron]: Deleted ${deletedPagesCount} pages, ${deletedBlocksCount} blocks`);
    }
    catch (error: any) {
      log.error(`[cron]: Error deleting archived pages: ${error.stack || error.message || error}`, { error });
    }
  });
}

main();
