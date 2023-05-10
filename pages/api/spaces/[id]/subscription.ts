import { UnauthorisedActionError, hasAccessToSpace } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getSpaceSubscription } from 'lib/subscription/getSpaceSubscription';
import type { SpaceSubscription } from 'lib/subscription/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getSpaceSubscriptionController);

async function getSpaceSubscriptionController(req: NextApiRequest, res: NextApiResponse<SpaceSubscription | null>) {
  const { id: spaceId } = req.query as { id: string };
  const userId = req.session.user.id;

  const spaceAccess = await hasAccessToSpace({ spaceId, userId, adminOnly: false });

  if (spaceAccess.error) {
    throw new UnauthorisedActionError();
  }

  const spaceSubscription = await getSpaceSubscription({
    spaceId
  });

  return res.status(200).json(spaceSubscription);
}

export default withSessionRoute(handler);
