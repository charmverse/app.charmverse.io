import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import { relay } from 'lib/websockets/relay';

import { modifyChildPages } from './modifyChildPages';

export async function archivePage({
  archive,
  pageId,
  userId,
  spaceId
}: {
  archive: boolean;
  pageId: string;
  userId: string;
  spaceId: string;
}) {
  const modifiedChildPageIds = await modifyChildPages(pageId, userId, archive ? 'archive' : 'restore');
  // If we are restoring page then severe the link with parent, only if its not of type card
  // A card type page can't doesn't have any meaning without its parent, and it gets a lot of metadata from its parent
  if (!archive) {
    const page = await prisma.page.findUnique({
      where: {
        id: pageId
      },
      select: {
        type: true
      }
    });
    if (page?.type !== 'card') {
      await prisma.page.update({
        where: {
          id: pageId
        },
        data: {
          parentId: null
        }
      });

      if (page?.type.match(/board/)) {
        await prisma.block.update({
          where: {
            id: pageId
          },
          data: {
            parentId: undefined
          }
        });
      }

      await premiumPermissionsApiClient.pages.setupPagePermissionsAfterEvent({ event: 'repositioned', pageId });
    }
  }

  trackUserAction(archive ? 'archive_page' : 'restore_page', { userId, spaceId, pageId });

  log.info(`User ${archive ? 'archived' : 'restored'} a page`, {
    pageId,
    pageIds: modifiedChildPageIds,
    spaceId,
    userId
  });

  const deletedAt = archive ? new Date() : null;
  const deletedBy = archive ? userId : null;

  relay.broadcast(
    {
      type: 'pages_meta_updated',
      payload: modifiedChildPageIds.map((id) => ({ id, deletedAt, spaceId, deletedBy }))
    },
    spaceId
  );

  if (archive) {
    relay.broadcast(
      {
        type: 'pages_restored',
        payload: modifiedChildPageIds.map((id) => ({ id }))
      },
      spaceId
    );
  } else {
    relay.broadcast(
      {
        type: 'pages_deleted',
        payload: modifiedChildPageIds.map((id) => ({ id }))
      },
      spaceId
    );
  }

  return { modifiedChildPageIds };
}
