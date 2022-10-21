
import log from 'lib/log';
import { count } from 'lib/metrics';
import { deleteArchivedPages } from 'lib/pages/server/deleteArchivedPages';

const MAX_ARCHIVE_DAYS = process.env.MAX_ARCHIVE_DAYS ? parseInt(process.env.MAX_ARCHIVE_DAYS) : 30;

export async function task () {

  log.debug('Running delete-archived cron job');

  try {
    const {
      deletedPagesCount,
      deletedBlocksCount,
      archivedBlocksCount,
      archivedPagesCount,
      deletedProposalsCount,
      deletedBountiesCount
    } = await deleteArchivedPages(MAX_ARCHIVE_DAYS);

    log.info(`Deleted ${deletedPagesCount} pages, ${deletedBlocksCount} blocks`);

    count('cron.delete-archived.deleted-proposals', deletedProposalsCount);
    count('cron.delete-archived.deleted-bounties', deletedBountiesCount);
    count('cron.delete-archived.deleted-pages', deletedPagesCount);
    count('cron.delete-archived.deleted-blocks', deletedBlocksCount);
    count('cron.delete-archived.archived-pages', archivedPagesCount);
    count('cron.delete-archived.archived-blocks', archivedBlocksCount);
  }
  catch (error: any) {
    log.error(`Error deleting archived pages: ${error.stack || error.message || error}`, { error });
  }
}
