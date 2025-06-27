import { log } from '@packages/core/log';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import { relay } from '@packages/websockets/relay';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { togglePageLock } from 'lib/pages/togglePageLock';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(togglePageLockController);

async function togglePageLockController(req: NextApiRequest, res: NextApiResponse) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (!permissions.edit_lock) {
    throw new ActionNotPermittedError('You cannot edit the lock for this page');
  }

  const updatedPage = await togglePageLock({
    isLocked: req.body.isLocked,
    pageId,
    userId
  });

  relay.broadcast(
    {
      type: 'pages_meta_updated',
      payload: [updatedPage]
    },
    updatedPage.spaceId
  );

  if (updatedPage.boardId) {
    relay.broadcast(
      {
        type: 'blocks_updated',
        payload: [
          {
            id: updatedPage.id,
            spaceId: updatedPage.spaceId,
            type: 'board',
            isLocked: updatedPage.isLocked,
            pageType: updatedPage.type
          }
        ]
      },
      updatedPage.spaceId
    );
  }

  log.info('User toggled the lock state of a page', {
    pageId,
    isLocked: req.body.isLocked,
    userId
  });

  res.status(200).json(updatedPage);
}

export default withSessionRoute(handler);
