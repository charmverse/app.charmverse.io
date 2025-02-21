import { UnauthorisedActionError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import { getRewardOrThrow } from 'lib/rewards/getReward';
import { markRewardAsPaid } from 'lib/rewards/markRewardAsPaid';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(markRewardAsPaidController);

async function markRewardAsPaidController(req: NextApiRequest, res: NextApiResponse) {
  const { id: rewardId } = req.query as { id: string };

  const reward = await getRewardOrThrow({ rewardId });

  const userId = req.session.user.id;

  const permissions = await computeBountyPermissions({
    resourceId: reward.id,
    userId
  });

  if (!permissions.mark_paid) {
    throw new UnauthorisedActionError('You do not have the permission to mark this bounty as paid');
  }

  const completeReward = await markRewardAsPaid(reward.id);

  return res.status(200).json(completeReward);
}

export default withSessionRoute(handler);
