import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasOnBoardedWorkspace } from 'lib/users/hasOnboardedWorkspace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' })).get(getOnboarding);

async function getOnboarding(req: NextApiRequest, res: NextApiResponse<boolean>) {
  const spaceId = req.query.id as string;
  const { id: userId } = req.session.user;

  const workspaceOnboarded = await hasOnBoardedWorkspace({ spaceId, userId });

  return res.status(200).json(workspaceOnboarded);
}

export default withSessionRoute(handler);
