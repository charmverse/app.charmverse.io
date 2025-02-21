import { log } from '@charmverse/core/log';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import type { AbstractWebsocketBroadcaster } from '@root/lib/websockets/interfaces';

import { trashOrDeletePage } from './trashOrDeletePage';

export async function trashPages({
  trash,
  pageIds,
  userId,
  spaceId,
  relay
}: {
  trash: boolean;
  pageIds: string[];
  userId: string;
  spaceId: string;
  relay: AbstractWebsocketBroadcaster;
}) {
  const modifiedChildPageIds: string[] = [];

  for (const pageId of pageIds) {
    modifiedChildPageIds.push(...(await trashOrDeletePage(pageId, userId, trash ? 'trash' : 'restore')));
    trackUserAction(trash ? 'archive_page' : 'restore_page', { userId, spaceId, pageId });
    log.info(`User ${trash ? 'trashed' : 'restored'} a page`, {
      pageId,
      spaceId,
      userId
    });
  }
  // commenting this out, in case we need it - 1/18/2024
  // const deletedAt = trash ? new Date() : null;
  // const deletedBy = trash ? userId : null;
  // relay.broadcast(
  //   {
  //     type: 'pages_meta_updated',
  //     payload: modifiedChildPageIds.map((id) => ({ id, deletedAt, spaceId, deletedBy }))
  //   },
  //   spaceId
  // );

  relay.broadcast(
    {
      type: trash ? 'pages_deleted' : 'pages_restored',
      payload: modifiedChildPageIds.map((id) => ({ id }))
    },
    spaceId
  );

  if (trash) {
    relay.broadcast(
      {
        type: 'blocks_deleted',
        payload: modifiedChildPageIds.map((id) => ({ id }))
      },
      spaceId
    );
  }

  return { modifiedChildPageIds };
}
