import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import log from 'lib/log';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import type { ModifyChildPagesResponse } from 'lib/pages';
import { modifyChildPages } from 'lib/pages/modifyChildPages';
import { PageNotFoundError } from 'lib/pages/server';
import { computeUserPagePermissions, setupPermissionsAfterPageRepositioned } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['archive'], 'body'))
  .put(togglePageArchiveStatus);

async function togglePageArchiveStatus(req: NextApiRequest, res: NextApiResponse<ModifyChildPagesResponse>) {
  const pageId = req.query.id as string;
  const { archive } = req.body as { archive: boolean };
  const userId = req.session.user.id;

  const pageSpaceId = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      spaceId: true
    }
  });

  if (!pageSpaceId) {
    throw new PageNotFoundError(pageId);
  }

  const permissions = await computeUserPagePermissions({
    resourceId: pageId,
    userId
  });

  if (permissions.delete !== true) {
    throw new ActionNotPermittedError('You are not allowed to delete this page.');
  }

  const rootBlock = await prisma.block.findUnique({
    where: {
      id: pageId
    }
  });

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

      await setupPermissionsAfterPageRepositioned(pageId);
    }
  }

  trackUserAction(archive ? 'archive_page' : 'restore_page', { userId, spaceId: pageSpaceId.spaceId, pageId });

  log.info(`User ${archive ? 'archived' : 'restored'} a page`, {
    pageId,
    pageIds: modifiedChildPageIds,
    spaceId: pageSpaceId.spaceId,
    userId
  });

  const deletedAt = archive ? new Date() : null;
  const deletedBy = archive ? userId : null;

  relay.broadcast(
    {
      type: 'pages_meta_updated',
      payload: modifiedChildPageIds.map((id) => ({ id, deletedAt, spaceId: pageSpaceId.spaceId, deletedBy }))
    },
    pageSpaceId.spaceId
  );

  return res.status(200).json({ pageIds: modifiedChildPageIds, rootBlock });
}

export default withSessionRoute(handler);
