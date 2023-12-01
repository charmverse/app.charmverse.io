import { DataNotFoundError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { SpaceNotFoundError } from 'lib/public-api';
import { withSessionRoute } from 'lib/session/withSession';
import { updateSpace } from 'lib/spaces/updateSpace';
import { deleteProSubscription } from 'lib/subscription/deleteProSubscription';
import { updateCustomerStripeInfo } from 'lib/subscription/updateCustomerStripeInfo';
import { replaceS3Domain } from 'lib/utilities/url';

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

  const existingSpace = await prisma.space.findUnique({
    where: {
      id: spaceId
    },
    select: {
      domain: true
    }
  });

  if (!existingSpace) {
    throw new DataNotFoundError(`Space with id ${spaceId} not found`);
  }

  const updatedSpace = await updateSpace(spaceId, req.body);
  if (updatedSpace.domain !== existingSpace.domain) {
    try {
      await updateCustomerStripeInfo({
        spaceId,
        update: {
          metadata: {
            domain: updatedSpace.domain
          }
        }
      });
    } catch (err) {
      log.error(`Error updating stripe customer details`, { spaceId, err });
    }
  }

  res.status(200).send(updatedSpace);
}

async function deleteSpace(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id;

  try {
    await deleteProSubscription({ spaceId, userId });
  } catch (_e) {
    log.error(`Error deleting the pro subscription when deleting the space.`, { spaceId, userId });
  }

  await prisma.space.delete({
    where: {
      id: req.query.id as string
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
