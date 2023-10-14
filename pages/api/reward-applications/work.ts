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
      key: 'rewardId',
      location: 'body',
      resourceIdType: 'bounty'
    })
  )
  .put(workOnRewardController);
async function workOnRewardController(req: NextApiRequest, res: NextApiResponse<Application>) {
  const applicationId = req.query.applicationId ?? req.body.applicationId;
  const userId = req.session.user.id;

  // Check user's permission before applying to a reward.
  const rewardPermissions = await computeBountyPermissions({ resourceId: req.body.rewardId, userId });

  if (!rewardPermissions.work) {
    throw new UnauthorisedActionError('You do not have permissions to work on this reward.');
  }

  const applicationResponse = await work({ ...req.body, applicationId, userId });

  res.status(200).json(applicationResponse);
}

export default withSessionRoute(handler);
