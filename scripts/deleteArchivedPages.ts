import log from 'lib/log';
import cron from 'node-cron';
import { deleteArchivedPages } from 'lib/pages/server/deleteArchivedPages';

const MAX_ARCHIVE_PAGE_DAYS = 30;

export async function main () {
  log.debug('[cron]: Starting delete-archived-pages cron job');
  // Cron job that runs every hour
  cron.schedule('0 * * * *', async () => {
    const { deletedPagesCount, deletedBlocksCount } = await deleteArchivedPages(MAX_ARCHIVE_PAGE_DAYS);
    // log.debug(`[cron]: Deleted ${deletedPagesCount} pages, ${deletedBlocksCount} blocks`);
  });
}

main();
