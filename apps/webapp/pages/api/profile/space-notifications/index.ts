import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { ClientUserSpaceNotifications } from '@packages/lib/userNotifications/spaceNotifications';
import { getUserSpaceNotifications } from '@packages/lib/userNotifications/spaceNotifications';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getNotifications);

async function getNotifications(req: NextApiRequest, res: NextApiResponse<ClientUserSpaceNotifications>) {
  const { spaceId } = req.query;

  if (typeof spaceId !== 'string') {
    throw new InvalidInputError('spaceId must be a string');
  }

  const settings = await getUserSpaceNotifications({
    spaceId,
    userId: req.session.user.id
  });

  res.status(200).json(settings);
}

export default withSessionRoute(handler);
