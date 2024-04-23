import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { getRewardOrThrow } from 'lib/rewards/getReward';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import type { RewardPublishData } from 'lib/rewards/publishReward';
import { publishReward } from 'lib/rewards/publishReward';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError, UnauthorisedActionError } from 'lib/utils/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(publishRewardController);

async function publishRewardController(req: NextApiRequest, res: NextApiResponse<RewardWithUsers>) {
  const { id } = req.query;
  const reward = await getRewardOrThrow({ rewardId: id as string });
  const userId = req.session.user.id;
  if (reward.status !== 'draft') {
    throw new InvalidInputError('Reward is not in draft state.');
  }

  if (reward.createdBy !== userId) {
    throw new UnauthorisedActionError('You do not have permission to publish this reward.');
  }

  const rewardPublishData = req.body as RewardPublishData;

  const publishedReward = await publishReward(rewardPublishData);

  res.status(200).json(publishedReward);
}

export default withSessionRoute(handler);
