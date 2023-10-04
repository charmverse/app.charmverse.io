import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { lockApplicationAndSubmissions } from 'lib/rewards/lockApplicationAndSubmissions';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(closeSubmissionsController);

async function closeSubmissionsController(req: NextApiRequest, res: NextApiResponse<RewardWithUsers>) {
  const { id: rewardId } = req.query as { id: string };

  const userId = req.session.user.id;

  const permissions = await computeBountyPermissions({
    allowAdminBypass: true,
    resourceId: rewardId,
    userId
  });

  if (!permissions.lock) {
    throw new UnauthorisedActionError('You cannot close submissions for this reward.');
  }

  const rewardWithClosedSubmissions = await lockApplicationAndSubmissions({
    rewardId,
    lock: req.query.lock === 'true'
  });

  return res.status(200).json(rewardWithClosedSubmissions);
}

export default withSessionRoute(handler);
