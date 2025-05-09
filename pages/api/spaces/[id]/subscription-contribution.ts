import { isSpaceAdmin } from '@root/lib/permissions/isSpaceAdmin';
import { checkSubscriptionContribution } from '@root/lib/subscription/checkSubscriptionContribution';
import type { CreateSubscriptionContributionRequest } from '@root/lib/subscription/createSubscriptionContribution';
import { createSubscriptionContribution } from '@root/lib/subscription/createSubscriptionContribution';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .post(createSubscriptionContributionController)
  .get(checkSubscriptionContributionController);

async function createSubscriptionContributionController(
  req: NextApiRequest,
  res: NextApiResponse<{ contributionId: string }>
) {
  const { id: spaceId } = req.query as { id: string };
  const payload = req.body as CreateSubscriptionContributionRequest;
  const userId = req.session.user.id;

  // If the tier is being changed, we need to check if the user is an admin
  if (payload.tier) {
    const isAdmin = await isSpaceAdmin({ spaceId, userId });
    if (!isAdmin) {
      throw new Error('You are not authorized to create a subscription contribution');
    }
  }

  const contribution = await createSubscriptionContribution({
    ...payload,
    spaceId,
    userId
  });

  res.status(200).json({ contributionId: contribution.id });
}

async function checkSubscriptionContributionController(req: NextApiRequest, res: NextApiResponse<string>) {
  const payload = req.query as { contributionId: string };

  await checkSubscriptionContribution({ contributionId: payload.contributionId });

  res.status(200).end();
}
