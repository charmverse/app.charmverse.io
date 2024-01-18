import { log } from '@charmverse/core/log';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import type { AbstractWebsocketBroadcaster } from 'lib/websockets/interfaces';

import { modifyChildPages } from './modifyChildPages';

export async function trashPages({
  trash,
  pageIds,
  userId,
  spaceId,
  emitPageStatusEvent = true,
  relay
}: {
  trash: boolean;
  pageIds: string[];
  userId: string;
  spaceId: string;
  emitPageStatusEvent?: boolean;
  relay: AbstractWebsocketBroadcaster;
}) {
  const modifiedChildPageIds: string[] = [];

  for (const pageId of pageIds) {
    modifiedChildPageIds.push(...(await modifyChildPages(pageId, userId, trash ? 'trash' : 'restore')));
    trackUserAction(trash ? 'archive_page' : 'restore_page', { userId, spaceId, pageId });
    log.info(`User ${trash ? 'trashed' : 'restored'} a page`, {
      pageIds: modifiedChildPageIds,
      spaceId,
      userId
    });
  }

  const deletedAt = trash ? new Date() : null;
  const deletedBy = trash ? userId : null;

  relay.broadcast(
    {
      type: 'pages_meta_updated',
      payload: modifiedChildPageIds.map((id) => ({ id, deletedAt, spaceId, deletedBy }))
    },
    spaceId
  );

  if (emitPageStatusEvent) {
    relay.broadcast(
      {
        type: trash ? 'pages_deleted' : 'pages_restored',
        payload: modifiedChildPageIds.map((id) => ({ id }))
      },
      spaceId
    );
  }

  return { modifiedChildPageIds };
}
