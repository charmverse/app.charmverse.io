import { UnauthorisedActionError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { isSpaceAdmin } from 'lib/permissions/isSpaceAdmin';
import { getRewardOrThrow } from 'lib/rewards/getReward';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { publishReward } from 'lib/rewards/publishReward';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(publishRewardController);

async function publishRewardController(req: NextApiRequest, res: NextApiResponse<RewardWithUsers>) {
  const rewardId = req.query.id as string;
  const reward = await getRewardOrThrow({ rewardId });
  const userId = req.session.user.id;

  const isAdmin = isSpaceAdmin({
    spaceId: reward.spaceId,
    userId
  });

  if (!(reward.createdBy === userId || isAdmin)) {
    throw new UnauthorisedActionError('You do not have permission to publish this reward.');
  }

  const publishedReward = await publishReward(rewardId);

  res.status(200).json(publishedReward);
}

export default withSessionRoute(handler);
