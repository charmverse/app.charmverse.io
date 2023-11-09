import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplates';
import { getRewardTemplates } from 'lib/rewards/getRewardTemplates';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getRewardTemplatesController);

async function getRewardTemplatesController(req: NextApiRequest, res: NextApiResponse<RewardTemplate[]>) {
  const userId = req.session.user?.id;
  const spaceId = req.query.id as string;

  const proposals = await getRewardTemplates({
    spaceId,
    userId
  });

  return res.status(200).json(proposals);
}

export default withSessionRoute(handler);
