import { completeOnboarding } from '@packages/users/completeOnboarding';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' })).put(completeOnboardingHandler);

async function completeOnboardingHandler(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.id as string;
  const { id: userId } = req.session.user;

  await completeOnboarding({ spaceId, userId });

  return res.status(200).end();
}

export default withSessionRoute(handler);
