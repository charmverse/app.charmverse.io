import type { Space } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { InvalidStateError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { customConditionJoinSpace, type CustomJoinParams } from 'lib/spaces/customConditionJoinSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(customJoinHandler);

async function customJoinHandler(req: NextApiRequest, res: NextApiResponse<Space>) {
  const joinParams: CustomJoinParams = req.body;
  const userId = req.session.user.id;
  const { id: spaceId } = req.query as { id: string };

  const space = await customConditionJoinSpace({ userId, spaceId, params: joinParams });

  if (!space) {
    throw new InvalidStateError(`Failed to join space.`);
  }

  res.status(200).send(space);
}

export default withSessionRoute(handler);
