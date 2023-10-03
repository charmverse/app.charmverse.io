import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import { closeOutReward } from 'lib/rewards/closeOutReward';
import { getRewardOrThrow } from 'lib/rewards/getReward';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(closeRewardController);

async function closeRewardController(req: NextApiRequest, res: NextApiResponse<RewardWithUsers>) {
  const { id: rewardId } = req.query as { id: string };

  const bounty = await getRewardOrThrow({ rewardId });

  const userId = req.session.user.id;

  const permissions = await computeBountyPermissions({
    allowAdminBypass: true,
    resourceId: bounty.id,
    userId
  });

  if (!permissions.lock) {
    throw new UnauthorisedActionError('You do not have the permission to close this bounty');
  }

  const completeReward = await closeOutReward(rewardId);

  return res.status(200).json(completeReward);
}

export default withSessionRoute(handler);
