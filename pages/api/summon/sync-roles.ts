import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireKeys } from 'lib/middleware/requireKeys';
import { withSessionRoute } from 'lib/session/withSession';
import { syncSummonSpaceRoles } from 'lib/summon/syncSummonSpaceRoles';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys([{ key: 'spaceId', valueType: 'uuid' }], 'query'))
  .get(syncSummonSpaceRolesController);

async function syncSummonSpaceRolesController(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.spaceId as string;
  const userId = req.session?.user?.id;

  const { totalSpaceRolesAdded, totalSpaceRolesUpdated } = await syncSummonSpaceRoles({ spaceId, userId });
  if (totalSpaceRolesUpdated !== 0 || totalSpaceRolesAdded !== 0) {
    log.debug(`Space roles sync result`, {
      spaceId,
      totalSpaceRolesAdded,
      totalSpaceRolesUpdated
    });
  }

  return res.status(200).send({ totalSpaceRolesAdded, totalSpaceRolesUpdated });
}

export default withSessionRoute(handler);
