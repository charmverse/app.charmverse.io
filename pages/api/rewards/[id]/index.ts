import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { getRewardOrThrow } from 'lib/rewards/getReward';
import type { RewardWithUsers, RewardWithUsersAndPageMeta } from 'lib/rewards/interfaces';
import { rollupRewardStatus } from 'lib/rewards/rollupRewardStatus';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import { updateRewardSettings } from 'lib/rewards/updateRewardSettings';
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
  .get(getRewardController)
  .put(updateReward);

async function getRewardController(req: NextApiRequest, res: NextApiResponse<RewardWithUsersAndPageMeta>) {
  const { id } = req.query;

  const reward = await getRewardOrThrow({ rewardId: id as string });

  const pageId = reward.id;

  const permissions = await req.basePermissionsClient.pages.computePagePermissions({
    resourceId: pageId,
    userId: req.session.user?.id
  });

  if (!permissions.read) {
    throw new UnauthorisedActionError('You do not have permissions to view this reward.');
  }

  const rewardPage = await prisma.page.findUniqueOrThrow({
    where: {
      id: reward.id
    },
    select: {
      id: true,
      title: true,
      path: true
    }
  });

  res.status(200).json({ ...reward, page: rewardPage });
}

async function updateReward(req: NextApiRequest, res: NextApiResponse<RewardWithUsers>) {
  const { id } = req.query as { id: string };

  const updateContent = (req.body ?? {}) as UpdateableRewardFields;

  const userId = req.session.user.id;

  const rewardPagePermissions = await req.basePermissionsClient.pages.computePagePermissions({
    resourceId: id,
    userId
  });

  if (rewardPagePermissions.edit_content !== true) {
    throw new UnauthorisedActionError('You do not have permissions to edit this reward.');
  }
  await updateRewardSettings({
    rewardId: id,
    updateContent
  });

  const rolledUpReward = await rollupRewardStatus({ rewardId: id });

  res.status(200).json(rolledUpReward);
}

export default withSessionRoute(handler);
