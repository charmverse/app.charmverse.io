import { prisma } from '@charmverse/core/prisma-client';
import { UnauthorisedActionError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { computeBountyPermissions } from '@packages/lib/permissions/bounties';
import { closeOutReward } from '@packages/lib/rewards/closeOutReward';
import type { RewardWithUsers } from '@packages/lib/rewards/interfaces';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(closeRewardController);

async function closeRewardController(req: NextApiRequest, res: NextApiResponse<RewardWithUsers>) {
  const { id: rewardId } = req.query as { id: string };

  const page = await prisma.page.findUniqueOrThrow({
    where: {
      bountyId: rewardId
    },
    select: {
      id: true
    }
  });

  const userId = req.session.user.id;

  const permissions = await computeBountyPermissions({
    resourceId: rewardId,
    userId
  });

  if (!permissions.lock) {
    throw new UnauthorisedActionError('You do not have the permission to close this reward');
  }

  const completeReward = await closeOutReward(rewardId);

  return res.status(200).json(completeReward);
}

export default withSessionRoute(handler);
