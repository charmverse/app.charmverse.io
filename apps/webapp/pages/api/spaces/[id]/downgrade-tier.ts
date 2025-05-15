import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { DowngradeSubscriptionTierRequest } from '@packages/lib/subscription/downgradeSubscriptionTier';
import { downgradeSubscriptionTier } from '@packages/lib/subscription/downgradeSubscriptionTier';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(downgradeTierController);

async function downgradeTierController(req: NextApiRequest, res: NextApiResponse<string>) {
  const { id: spaceId } = req.query as { id: string };

  await downgradeSubscriptionTier({
    ...(req.body as DowngradeSubscriptionTierRequest),
    spaceId
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
