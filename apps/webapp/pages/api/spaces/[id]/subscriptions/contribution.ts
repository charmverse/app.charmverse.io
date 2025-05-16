import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { CreateSubscriptionContributionRequest } from '@packages/spaces/createSpaceContribution';
import { createSubscriptionContribution } from '@packages/spaces/createSpaceContribution';
import type { SubscriptionReceipt } from '@packages/spaces/getSubscriptionReceipts';
import { getSubscriptionReceipts } from '@packages/spaces/getSubscriptionReceipts';
import { verifyDevTokenTransfer } from '@packages/spaces/verifyDevTokenTransfer';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .post(createSubscriptionContributionController)
  .get(getSubscriptionContributionsController);

async function createSubscriptionContributionController(req: NextApiRequest, res: NextApiResponse<string>) {
  const { id: spaceId } = req.query as { id: string };
  const userId = req.session.user.id;

  const payload = req.body as CreateSubscriptionContributionRequest;

  await verifyDevTokenTransfer(payload);

  const spaceContribution = await createSubscriptionContribution({
    ...payload,
    spaceId,
    userId
  });

  res.status(200).json(spaceContribution.id);
}

async function getSubscriptionContributionsController(
  req: NextApiRequest,
  res: NextApiResponse<SubscriptionReceipt[]>
) {
  const { id: spaceId } = req.query as { id: string };
  const subscriptionReceipts = await getSubscriptionReceipts(spaceId);

  res.status(200).json(subscriptionReceipts);
}

export default withSessionRoute(handler);
