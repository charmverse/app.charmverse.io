import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireKeys } from 'lib/middleware/requireKeys';
import { withSessionRoute } from 'lib/session/withSession';
import { syncSummonSpaceRoles } from 'lib/summon/syncSummonSpaceRoles';
import { verifyMembership } from 'lib/summon/verifyMembership';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys([{ key: 'spaceId', truthy: true }], 'query'))
  .get(syncSummonSpaceRolesController);

async function syncSummonSpaceRolesController(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.spaceId as string;
  const userId = req.session?.user?.id;

  const result = await verifyMembership({ spaceId, userId });

  if (!result.isVerified) {
    throw new InvalidInputError('You are not a member of this space');
  }

  await syncSummonSpaceRoles({
    spaceId,
    userId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
