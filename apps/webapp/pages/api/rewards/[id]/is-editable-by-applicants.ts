import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { requirePaidPermissionsSubscription } from '@packages/lib/middleware/requirePaidPermissionsSubscription';
import { getRewardOrThrow } from '@packages/lib/rewards/getReward';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    requirePaidPermissionsSubscription({
      key: 'id',
      location: 'query',
      resourceIdType: 'bounty'
    })
  )
  .get(isRewardEditable);

async function isRewardEditable(req: NextApiRequest, res: NextApiResponse<{ editable: boolean }>) {
  const { id } = req.query;

  const reward = await getRewardOrThrow({ rewardId: id as string });

  const rewardPage = await prisma.page.findUniqueOrThrow({
    where: {
      bountyId: reward.id
    },
    select: {
      id: true,
      title: true,
      path: true
    }
  });

  const pageId = rewardPage.id;

  const result = await req.premiumPermissionsClient.pages.isBountyPageEditableByApplicants({
    resourceId: pageId
  });

  res.status(200).send(result);
}

export default withSessionRoute(handler);
