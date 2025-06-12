import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { UnauthorisedActionError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';
import nc from 'next-connect';

import type { SpaceResult } from 'lib/admin/getSpaces';
import { getSpaces } from 'lib/admin/getSpaces';
import { whitelist } from 'lib/admin/users';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).use(_requireAdmin).get(getSpacesEndpoint).put(updateSpaceController);

function _requireAdmin(req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  const userId = req.session?.user?.id;
  if (!whitelist.includes(userId)) {
    throw new UnauthorisedActionError('You do not have permission to access this api');
  }
  next();
}

async function getSpacesEndpoint(req: NextApiRequest, res: NextApiResponse<SpaceResult[]>) {
  const userId = req.session?.user?.id;

  if (!whitelist.includes(userId)) {
    throw new UnauthorisedActionError('You do not have permission to access this api');
  }
  const result = await getSpaces(req.query);

  return res.status(200).json(result);
}

export type UpdateSpaceBody = {
  id: string;
  subscriptionTier: SpaceSubscriptionTier;
  subscriptionMonthlyPrice: number | null;
};

async function updateSpaceController(req: NextApiRequest, res: NextApiResponse) {
  const { id: spaceId, subscriptionTier, subscriptionMonthlyPrice } = req.body as UpdateSpaceBody;

  const updatedSpace = await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      subscriptionTier,
      subscriptionMonthlyPrice
    }
  });

  res.status(200).send(updatedSpace);
}

export default withSessionRoute(handler);
