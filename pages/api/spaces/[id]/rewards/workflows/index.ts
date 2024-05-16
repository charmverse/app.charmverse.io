import type { NextApiRequest, NextApiResponse } from 'next';

import { defaultHandler } from 'lib/middleware/handler';
import { getRewardWorkflows, type RewardWorkflow } from 'lib/rewards/getRewardWorkflows';
import { withSessionRoute } from 'lib/session/withSession';

const handler = defaultHandler();

handler.get(getWorkflowsController);

async function getWorkflowsController(req: NextApiRequest, res: NextApiResponse<RewardWorkflow[]>) {
  const spaceId = req.query.id as string;
  const rewardWorkflows = getRewardWorkflows();
  return res.status(200).json(rewardWorkflows);
}

export default withSessionRoute(handler);
