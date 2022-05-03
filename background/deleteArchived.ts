import cron from 'node-cron';
import log from 'lib/log';
import { deleteArchivedPages } from 'lib/pages/server/deleteArchivedPages';
import { gauge } from 'lib/metrics';

const MAX_ARCHIVE_DAYS = process.env.MAX_ARCHIVE_DAYS ? parseInt(process.env.MAX_ARCHIVE_DAYS) : 30;

export async function main () {

  log.debug('Starting delete-archived cron job');

  // Cron job that runs every hour
  cron.schedule('0 * * * *', async () => {

    log.debug('Running delete-archived cron job');

    try {
      const { deletedPagesCount, deletedBlocksCount, archivedBlocksCount, archivedPagesCount } = await deleteArchivedPages(MAX_ARCHIVE_DAYS);

      log.info(`Deleted ${deletedPagesCount} pages, ${deletedBlocksCount} blocks`);

      gauge('cron.delete-archived.deleted-pages', deletedPagesCount);
      gauge('cron.delete-archived.deleted-blocks', deletedBlocksCount);
      gauge('cron.delete-archived.archived-pages', archivedPagesCount);
      gauge('cron.delete-archived.archived-blocks', archivedBlocksCount);
    }
    catch (error: any) {
      log.error(`Error deleting archived pages: ${error.stack || error.message || error}`, { error });
    }
  });
}

main();
