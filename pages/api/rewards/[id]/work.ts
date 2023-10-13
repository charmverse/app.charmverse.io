import type { Application } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import { work } from 'lib/rewards/work';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'bounty'
    })
  )
  .put(workOnRewardController);
async function workOnRewardController(req: NextApiRequest, res: NextApiResponse<Application>) {
  const { id, applicationId } = req.query;
  const userId = req.session.user.id;

  // Check user's permission before applying to a reward.
  const rewardPermissions = await computeBountyPermissions({ resourceId: id as string, userId });

  if (!rewardPermissions.work) {
    throw new UnauthorisedActionError('You do not have permissions to work on this reward.');
  }

  const applicationResponse = await work({ ...req.body, rewardId: id, applicationId, userId });

  res.status(200).json(applicationResponse);
}

export default withSessionRoute(handler);
