import { hasAccessToSpace } from '@charmverse/core/permissions';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplate';
import { getRewardTemplates } from 'lib/rewards/getRewardTemplates';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getRewardTemplatesController);

async function getRewardTemplatesController(req: NextApiRequest, res: NextApiResponse<RewardTemplate[]>) {
  const userId = req.session.user?.id;
  const spaceId = req.query.id as string;

  const { spaceRole } = await hasAccessToSpace({
    spaceId,
    userId
  });

  if (!spaceRole) {
    return res.status(200).json([]);
  }

  const templates = await getRewardTemplates({
    spaceId,
    userId
  });

  return res.status(200).json(templates);
}

export default withSessionRoute(handler);
