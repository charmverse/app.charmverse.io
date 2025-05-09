import { onError, onNoMatch } from '@packages/lib/middleware';
import type { GetUserProposalsResponse } from '@packages/lib/proposals/getUserProposals';
import { getUserProposals } from '@packages/lib/proposals/getUserProposals';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getMyProposalsController);

async function getMyProposalsController(req: NextApiRequest, res: NextApiResponse<GetUserProposalsResponse>) {
  const userId = req.session.user?.id;
  const spaceId = req.query.id as string;
  const actionableProposals = await getUserProposals({ spaceId, userId });

  return res.status(200).json(actionableProposals);
}

export default withSessionRoute(handler);
