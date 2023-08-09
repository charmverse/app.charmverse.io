import { log } from '@charmverse/core/log';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { relay } from 'lib/websockets/relay';

import { modifyChildPages } from './modifyChildPages';

export async function archivePages({
  archive,
  pageIds,
  userId,
  spaceId
}: {
  archive: boolean;
  pageIds: string[];
  userId: string;
  spaceId: string;
}) {
  const modifiedChildPageIds: string[] = [];

  for (const pageId of pageIds) {
    modifiedChildPageIds.push(...(await modifyChildPages(pageId, userId, archive ? 'archive' : 'restore')));
    trackUserAction(archive ? 'archive_page' : 'restore_page', { userId, spaceId, pageId });
    log.info(`User ${archive ? 'archived' : 'restored'} a page`, {
      pageIds: modifiedChildPageIds,
      spaceId,
      userId
    });
  }

  const deletedAt = archive ? new Date() : null;
  const deletedBy = archive ? userId : null;

  relay.broadcast(
    {
      type: 'pages_meta_updated',
      payload: modifiedChildPageIds.map((id) => ({ id, deletedAt, spaceId, deletedBy }))
    },
    spaceId
  );

  relay.broadcast(
    {
      type: archive ? 'pages_deleted' : 'pages_restored',
      payload: modifiedChildPageIds.map((id) => ({ id }))
    },
    spaceId
  );
  return { modifiedChildPageIds };
}
