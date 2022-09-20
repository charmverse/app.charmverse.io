
import log from 'lib/log';
import { gauge } from 'lib/metrics';
import { deleteArchivedPages } from 'lib/pages/server/deleteArchivedPages';

const MAX_ARCHIVE_DAYS = process.env.MAX_ARCHIVE_DAYS ? parseInt(process.env.MAX_ARCHIVE_DAYS) : 30;

export default async function task () {

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

    gauge('cron.delete-archived.deleted-proposals', deletedProposalsCount);
    gauge('cron.delete-archived.deleted-bounties', deletedBountiesCount);
    gauge('cron.delete-archived.deleted-pages', deletedPagesCount);
    gauge('cron.delete-archived.deleted-blocks', deletedBlocksCount);
    gauge('cron.delete-archived.archived-pages', archivedPagesCount);
    gauge('cron.delete-archived.archived-blocks', archivedBlocksCount);
  }
  catch (error: any) {
    log.error(`Error deleting archived pages: ${error.stack || error.message || error}`, { error });
  }
}
