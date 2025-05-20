import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import {
  type CreateSubscriptionContributionRequest,
  recordSubscriptionContribution
} from '@packages/subscriptions/recordSubscriptionContribution';
import { verifyDevTokenTransfer } from '@packages/subscriptions/verifyDevTokenTransfer';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .post(recordSubscriptionContributionEndpoint);

async function recordSubscriptionContributionEndpoint(req: NextApiRequest, res: NextApiResponse<string>) {
  const { id: spaceId } = req.query as { id: string };
  const userId = req.session.user.id;

  const payload = req.body as CreateSubscriptionContributionRequest;

  await verifyDevTokenTransfer(payload);

  const spaceContribution = await recordSubscriptionContribution({
    ...payload,
    spaceId,
    userId
  });

  res.status(200).json(spaceContribution.id);
}

export default withSessionRoute(handler);
