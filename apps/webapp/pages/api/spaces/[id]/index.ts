import { log } from '@charmverse/core/log';
import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { deleteProSubscription } from '@packages/lib/subscription/deleteProSubscription';
import { replaceS3Domain } from '@packages/utils/url';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { SpaceNotFoundError } from 'lib/public-api';
import { updateSpace } from 'lib/spaces/updateSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }), getSpace)
  .put(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }), updateSpaceController)
  .delete(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }), deleteSpace);

async function getSpace(req: NextApiRequest, res: NextApiResponse<Space>) {
  const { id: spaceId } = req.query as { id: string };

  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    }
  });

  if (!space) {
    throw new SpaceNotFoundError(spaceId);
  }

  space.spaceImage = replaceS3Domain(space.spaceImage);

  res.status(200).json(space);
}

async function updateSpaceController(req: NextApiRequest, res: NextApiResponse<Space>) {
  const spaceId = req.query.id as string;

  const updatedSpace = await updateSpace(spaceId, req.body);

  res.status(200).send(updatedSpace);
}

async function deleteSpace(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id;

  try {
    await deleteProSubscription({ spaceId, userId });
  } catch (error) {
    log.error(`Error deleting the pro subscription when deleting the space.`, { error, spaceId, userId });
  }

  await prisma.space.delete({
    where: {
      id: req.query.id as string
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
