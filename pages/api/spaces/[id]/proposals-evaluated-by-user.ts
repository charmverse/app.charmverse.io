import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import type { RubricProposalsUserInfo } from 'lib/proposals/getProposalsEvaluatedByUser';
import { getProposalIdsEvaluatedByUser } from 'lib/proposals/getProposalsEvaluatedByUser';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getProposalsEvaluatedByUserController);

async function getProposalsEvaluatedByUserController(
  req: NextApiRequest,
  res: NextApiResponse<RubricProposalsUserInfo>
) {
  const userId = req.session.user?.id;
  const spaceId = req.query.id as string;

  const proposalsEvaluatedByUser = await getProposalIdsEvaluatedByUser({
    spaceId,
    userId
  });
  return res.status(200).json(proposalsEvaluatedByUser);
}

export default withSessionRoute(handler);
