import { prisma } from '@charmverse/core/prisma-client';
import { prismaToBlock, prismaToUIBlock } from '@packages/databases/block';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { updateTrackPageProfile } from '@packages/metrics/mixpanel/updateTrackPageProfile';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import { relay } from '@packages/websockets/relay';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { DuplicatePageResponse } from 'lib/pages/duplicatePage';
import { duplicatePage } from 'lib/pages/duplicatePage';
import { PageNotFoundError } from 'lib/public-api';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(duplicatePageRoute);

async function duplicatePageRoute(req: NextApiRequest, res: NextApiResponse<DuplicatePageResponse>) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const pageToDuplicate = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      parentId: true,
      spaceId: true,
      type: true,
      id: true
    }
  });

  if (!pageToDuplicate) {
    throw new PageNotFoundError(pageId);
  }

  const spacePermissions = await permissionsApiClient.spaces.computeSpacePermissions({
    resourceId: pageToDuplicate.spaceId,
    userId
  });

  if (!spacePermissions.createPage) {
    throw new ActionNotPermittedError('You are not allowed to duplicate this page.');
  }

  const result = await duplicatePage({
    pageId,
    parentId: pageToDuplicate.parentId,
    spaceId: pageToDuplicate.spaceId
  });

  await Promise.all(result.pages.map((page) => updateTrackPageProfile(page.id)));

  trackUserAction('duplicate_page', {
    userId,
    spaceId: pageToDuplicate.spaceId,
    pageId: pageToDuplicate.id
  });

  relay.broadcast(
    {
      type: 'blocks_created',
      payload: result.blocks.map((block) => {
        const page = result.pages.find((p) => (p.boardId || p.cardId) === block.id);
        return page ? prismaToUIBlock(block, page) : prismaToBlock(block);
      })
    },
    pageToDuplicate.spaceId
  );

  relay.broadcast(
    {
      type: 'pages_created',
      payload: result.pages
    },
    pageToDuplicate.spaceId
  );

  return res.status(200).send(result);
}

export default withSessionRoute(handler);
