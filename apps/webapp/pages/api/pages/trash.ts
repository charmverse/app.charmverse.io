import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import { trashPages } from '@packages/pages/trashPages';
import { InvalidInputError } from '@packages/utils/errors';
import { relay } from '@packages/websockets/relay';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { TrashOrDeletePageResponse } from 'lib/pages';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['pageIds', 'trash'], 'body'))
  .put(togglePageArchiveStatus);

async function togglePageArchiveStatus(req: NextApiRequest, res: NextApiResponse<TrashOrDeletePageResponse>) {
  const { trash, pageIds } = req.body as { trash: boolean; pageIds: string[] };
  const userId = req.session.user.id;

  if (!pageIds || !Array.isArray(pageIds) || pageIds.length === 0) {
    throw new InvalidInputError('pageIds must be an array');
  }

  const permissionsByPage = await permissionsApiClient.pages.bulkComputePagePermissions({
    pageIds,
    userId
  });

  const canDeleteAllPages = Object.values(permissionsByPage).every((permissions) => permissions.delete === true);
  if (!canDeleteAllPages) {
    throw new ActionNotPermittedError(`You do not have permissions to ${trash ? 'delete' : 'restore'} this page`);
  }

  const { spaceId } = await prisma.page.findUniqueOrThrow({
    where: {
      id: pageIds[0]
    },
    select: {
      spaceId: true
    }
  });

  const { modifiedChildPageIds } = await trashPages({
    trash,
    pageIds,
    userId,
    spaceId,
    relay
  });

  return res.status(200).json({ pageIds: modifiedChildPageIds });
}

export default withSessionRoute(handler);
